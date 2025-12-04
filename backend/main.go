package main

import (
	"bloodone/database"
	"bloodone/handlers"
	"bloodone/middleware"
	"bloodone/models"
	"log"
	"net/http"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	// Connetti al database JSON (nessun CGO richiesto - funziona su Windows)
	database.Connect()
	database.Migrate()

	// Inizializza OAuth
	handlers.InitOAuth()

	// Setup router
	router := gin.Default()

	// CORS
	config := cors.DefaultConfig()
	config.AllowOrigins = []string{"http://localhost:3000", "https://yourusername.github.io"}
	config.AllowHeaders = []string{"Origin", "Content-Type", "Authorization"}
	router.Use(cors.New(config))

	// Routes pubbliche
	public := router.Group("/api")
	{
		public.GET("/auth/google", handlers.GetGoogleLoginURL)
		public.GET("/auth/callback", handlers.GoogleCallback)
		public.POST("/auth/registration-request", handlers.SubmitRegistrationRequest)
	}

	// Routes protette
	protected := router.Group("/api")
	protected.Use(middleware.AuthMiddleware())
	{
		// Current user
		protected.GET("/me", handlers.GetCurrentUser)
		protected.PUT("/me", handlers.UpdateUser)

		// Donazioni dell'utente corrente
		protected.GET("/me/donations", func(c *gin.Context) {
			userID, _ := c.Get("user_id")
			c.Set("donor_id", userID)
			handlers.GetDonorHistory(c)
		})

		// Appuntamenti dell'utente corrente
		protected.GET("/me/appointments", func(c *gin.Context) {
			userID, _ := c.Get("user_id")
			var appointments []models.Appointment
			for _, a := range database.DB.Appointments {
				if a.DonorID == userID.(uint) {
					appointments = append(appointments, a)
				}
			}
			c.JSON(http.StatusOK, appointments)
		})

		// Conferma appuntamento
		protected.POST("/appointments/:id/confirm", handlers.ConfirmAppointment)
	}

	// Routes admin
	admin := router.Group("/api/admin")
	admin.Use(middleware.AuthMiddleware())
	admin.Use(middleware.AdminMiddleware())
	{
		// Gestione utenti
		admin.GET("/users", handlers.GetUsers)
		admin.GET("/users/:id", handlers.GetUser)
		admin.POST("/users", handlers.CreateUser)
		admin.PUT("/users/:id", handlers.UpdateUser)
		admin.DELETE("/users/:id", handlers.DeleteUser)
		admin.GET("/users/expiring", handlers.GetDonorsExpiringSoon)

		// Gestione donazioni
		admin.GET("/donations", handlers.GetDonations)
		admin.GET("/donations/:id", handlers.GetDonation)
		admin.POST("/donations", handlers.CreateDonation)
		admin.PUT("/donations/:id", handlers.UpdateDonation)
		admin.DELETE("/donations/:id", handlers.DeleteDonation)
		admin.GET("/donors/:id/donations", handlers.GetDonorHistory)

		// Gestione appuntamenti
		admin.GET("/appointments", handlers.GetAppointments)
		admin.GET("/appointments/:id", handlers.GetAppointment)
		admin.POST("/appointments", handlers.CreateAppointment)
		admin.POST("/appointments/propose", handlers.ProposeAppointmentDates)
		admin.PUT("/appointments/:id", handlers.UpdateAppointment)
		admin.DELETE("/appointments/:id", handlers.DeleteAppointment)
		admin.POST("/appointments/:id/cancel", handlers.CancelAppointment)
		admin.GET("/donors/:id/appointments", handlers.GetDonorAppointments)

		// Gestione schedule
		admin.GET("/schedule", handlers.GetSchedule)
		admin.PUT("/schedule", handlers.UpdateSchedule)
		admin.GET("/excluded-dates", handlers.GetExcludedDates)
		admin.POST("/excluded-dates", handlers.AddExcludedDate)
		admin.DELETE("/excluded-dates/:id", handlers.DeleteExcludedDate)
		admin.GET("/special-capacities", handlers.GetSpecialCapacities)
		admin.POST("/special-capacities", handlers.SetSpecialCapacity)
		admin.DELETE("/special-capacities/:id", handlers.DeleteSpecialCapacity)

		// Gestione sospensioni
		admin.GET("/suspensions", handlers.GetSuspensions)
		admin.POST("/suspensions", handlers.CreateSuspension)
		admin.PUT("/suspensions/:id/end", handlers.EndSuspension)

		// Gestione richieste di registrazione
		admin.GET("/registration-requests", handlers.GetRegistrationRequests)
		admin.GET("/registration-requests/count", handlers.GetPendingRequestsCount)
		admin.POST("/registration-requests/:id/approve", handlers.ApproveRegistrationRequest)
		admin.POST("/registration-requests/:id/associate", handlers.AssociateRegistrationRequest)
		admin.POST("/registration-requests/:id/reject", handlers.RejectRegistrationRequest)
		admin.DELETE("/registration-requests/:id", handlers.DeleteRegistrationRequest)
	}

	log.Println("Server starting on :8080")
	router.Run(":8080")
}
