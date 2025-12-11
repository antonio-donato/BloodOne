package handlers

import (
	"bloodone/database"
	"bloodone/models"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

func GetAppointments(c *gin.Context) {
	status := c.Query("status")

	// Creiamo una risposta con info utente incluse
	type AppointmentWithUser struct {
		ID            uint                     `json:"id"`
		CreatedAt     time.Time                `json:"created_at"`
		DonorID       uint                     `json:"donor_id"`
		UserID        uint                     `json:"user_id"`
		ProposedDate1 time.Time                `json:"proposed_date_1"`
		ProposedDate2 time.Time                `json:"proposed_date_2"`
		ProposedDate3 time.Time                `json:"proposed_date_3"`
		ConfirmedDate *time.Time               `json:"confirmed_date"`
		Status        models.AppointmentStatus `json:"status"`
		User          *models.User             `json:"user"`
	}

	var result []AppointmentWithUser
	for _, a := range database.DB.Appointments {
		// Filtro per status se specificato
		if status != "" && string(a.Status) != status {
			continue
		}

		// Trova l'utente
		var user *models.User
		for i := range database.DB.Users {
			if database.DB.Users[i].ID == a.DonorID {
				user = &database.DB.Users[i]
				break
			}
		}

		result = append(result, AppointmentWithUser{
			ID:            a.ID,
			CreatedAt:     a.CreatedAt,
			DonorID:       a.DonorID,
			UserID:        a.DonorID,
			ProposedDate1: a.ProposedDate1,
			ProposedDate2: a.ProposedDate2,
			ProposedDate3: a.ProposedDate3,
			ConfirmedDate: a.ConfirmedDate,
			Status:        a.Status,
			User:          user,
		})
	}

	c.JSON(http.StatusOK, result)
}

func GetAppointment(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	for _, a := range database.DB.Appointments {
		if a.ID == uint(id) {
			c.JSON(http.StatusOK, a)
			return
		}
	}
	c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
}

func CreateAppointment(c *gin.Context) {
	var appointment models.Appointment
	if err := c.ShouldBindJSON(&appointment); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	appointment.ID = database.DB.NextAppointmentID()
	appointment.CreatedAt = time.Now()
	appointment.Status = models.AppointmentStatusPending
	database.DB.Appointments = append(database.DB.Appointments, appointment)
	database.DB.Save()
	c.JSON(http.StatusCreated, appointment)
}

func ProposeAppointmentDates(c *gin.Context) {
	var req struct {
		DonorID       uint   `json:"donor_id"`
		ProposedDate1 string `json:"proposed_date_1"`
		ProposedDate2 string `json:"proposed_date_2"`
		ProposedDate3 string `json:"proposed_date_3"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Parse le date
	var date1, date2, date3 time.Time
	var err error

	if req.ProposedDate1 != "" {
		date1, err = time.Parse("2006-01-02", req.ProposedDate1)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Formato data 1 non valido"})
			return
		}
	} else {
		date1 = time.Now().AddDate(0, 0, 7)
	}

	if req.ProposedDate2 != "" {
		date2, err = time.Parse("2006-01-02", req.ProposedDate2)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Formato data 2 non valido"})
			return
		}
	} else {
		date2 = time.Now().AddDate(0, 0, 14)
	}

	if req.ProposedDate3 != "" {
		date3, err = time.Parse("2006-01-02", req.ProposedDate3)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Formato data 3 non valido"})
			return
		}
	} else {
		date3 = time.Now().AddDate(0, 0, 21)
	}

	// Verifica che il donatore non abbia già un appuntamento pending o confirmed
	for _, a := range database.DB.Appointments {
		if a.DonorID == req.DonorID && (a.Status == models.AppointmentStatusPending || a.Status == models.AppointmentStatusConfirmed) {
			c.JSON(http.StatusConflict, gin.H{"error": "Il donatore ha già un appuntamento attivo"})
			return
		}
	}

	appointment := models.Appointment{
		ID:            database.DB.NextAppointmentID(),
		DonorID:       req.DonorID,
		ProposedDate1: date1,
		ProposedDate2: date2,
		ProposedDate3: date3,
		Status:        models.AppointmentStatusPending,
		CreatedAt:     time.Now(),
	}
	database.DB.Appointments = append(database.DB.Appointments, appointment)
	database.DB.Save()
	c.JSON(http.StatusCreated, appointment)
}

func ConfirmAppointment(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	var req struct {
		SelectedDate time.Time `json:"selected_date"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	for i, a := range database.DB.Appointments {
		if a.ID == uint(id) {
			database.DB.Appointments[i].ConfirmedDate = &req.SelectedDate
			database.DB.Appointments[i].Status = models.AppointmentStatusConfirmed

			// Aggiorna anche next_appointment_date dell'utente
			for j := range database.DB.Users {
				if database.DB.Users[j].ID == a.DonorID {
					database.DB.Users[j].NextAppointmentDate = &req.SelectedDate
					database.DB.Users[j].UpdatedAt = time.Now()
					break
				}
			}

			database.DB.Save()
			c.JSON(http.StatusOK, database.DB.Appointments[i])
			return
		}
	}
	c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
}

func CancelAppointment(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)

	for i, a := range database.DB.Appointments {
		if a.ID == uint(id) {
			database.DB.Appointments[i].Status = models.AppointmentStatusCancelled
			database.DB.Save()
			c.JSON(http.StatusOK, gin.H{"message": "Appuntamento annullato"})
			return
		}
	}
	c.JSON(http.StatusNotFound, gin.H{"error": "Appuntamento non trovato"})
}

func UpdateAppointment(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Updated"})
}

func DeleteAppointment(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Deleted"})
}

func GetDonorAppointments(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	var appointments []models.Appointment
	for _, a := range database.DB.Appointments {
		if a.DonorID == uint(id) {
			appointments = append(appointments, a)
		}
	}
	c.JSON(http.StatusOK, appointments)
}
