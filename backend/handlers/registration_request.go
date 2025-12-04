package handlers

import (
	"bloodone/database"
	"bloodone/models"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

// SubmitRegistrationRequest - Endpoint pubblico per inviare richiesta di registrazione
func SubmitRegistrationRequest(c *gin.Context) {
	var req struct {
		Email       string `json:"email"`
		GoogleID    string `json:"google_id"`
		FirstName   string `json:"first_name"`
		LastName    string `json:"last_name"`
		PhoneNumber string `json:"phone_number"`
		Gender      string `json:"gender"`
		BirthDate   string `json:"birth_date"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	if req.Email == "" || req.FirstName == "" || req.LastName == "" || req.Gender == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Campi obbligatori mancanti"})
		return
	}
	
	// Verifica se esiste già una richiesta pending per questa email
	for _, r := range database.DB.RegistrationRequests {
		if r.Email == req.Email && r.Status == models.RegistrationRequestStatusPending {
			c.JSON(http.StatusConflict, gin.H{"error": "Richiesta già inviata"})
			return
		}
	}
	
	// Verifica se l'utente esiste già
	for _, u := range database.DB.Users {
		if u.Email == req.Email {
			c.JSON(http.StatusConflict, gin.H{"error": "Utente già registrato"})
			return
		}
	}
	
	// Parse birth date
	var birthDate *time.Time
	if req.BirthDate != "" {
		parsed, err := time.Parse("2006-01-02", req.BirthDate)
		if err == nil {
			birthDate = &parsed
		}
	}
	
	// Crea nuova richiesta
	newRequest := models.RegistrationRequest{
		ID:          database.DB.NextRegistrationRequestID(),
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
		Email:       req.Email,
		GoogleID:    req.GoogleID,
		FirstName:   req.FirstName,
		LastName:    req.LastName,
		PhoneNumber: req.PhoneNumber,
		Gender:      req.Gender,
		BirthDate:   birthDate,
		Status:      models.RegistrationRequestStatusPending,
	}
	
	database.DB.RegistrationRequests = append(database.DB.RegistrationRequests, newRequest)
	database.DB.Save()
	
	c.JSON(http.StatusCreated, gin.H{
		"message": "Richiesta inviata con successo",
		"request": newRequest,
	})
}

// GetRegistrationRequests - Lista richieste di registrazione
func GetRegistrationRequests(c *gin.Context) {
	status := c.Query("status")
	
	var requests []models.RegistrationRequest
	for _, req := range database.DB.RegistrationRequests {
		if status == "" || string(req.Status) == status {
			requests = append(requests, req)
		}
	}
	
	c.JSON(http.StatusOK, requests)
}

// GetPendingRequestsCount - Conta richieste pendenti
func GetPendingRequestsCount(c *gin.Context) {
	count := 0
	for _, req := range database.DB.RegistrationRequests {
		if req.Status == models.RegistrationRequestStatusPending {
			count++
		}
	}
	c.JSON(http.StatusOK, gin.H{"count": count})
}

// ApproveRegistrationRequest - Approva e crea nuovo utente
func ApproveRegistrationRequest(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	
	// Dati opzionali che l'admin può modificare
	var req struct {
		FirstName           string `json:"first_name"`
		LastName            string `json:"last_name"`
		PhoneNumber         string `json:"phone_number"`
		Gender              string `json:"gender"`
		BloodType           string `json:"blood_type"`
		BirthDate           string `json:"birth_date"`
		LastDonationDate    string `json:"last_donation_date"`
		NextAppointmentDate string `json:"next_appointment_date"`
		IsActive            *bool  `json:"is_active"`
		IsAdmin             *bool  `json:"is_admin"`
	}
	c.ShouldBindJSON(&req)
	
	// Trova la richiesta
	var request *models.RegistrationRequest
	var requestIndex int
	for i, r := range database.DB.RegistrationRequests {
		if r.ID == uint(id) {
			request = &database.DB.RegistrationRequests[i]
			requestIndex = i
			break
		}
	}
	
	if request == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Richiesta non trovata"})
		return
	}
	
	if request.Status != models.RegistrationRequestStatusPending {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Richiesta già processata"})
		return
	}
	
	// Verifica che non esista già un utente con questa email o GoogleID
	for _, u := range database.DB.Users {
		if u.Email == request.Email {
			c.JSON(http.StatusConflict, gin.H{"error": "Esiste già un utente con questa email"})
			return
		}
		if u.GoogleID == request.GoogleID {
			c.JSON(http.StatusConflict, gin.H{"error": "Esiste già un utente con questo account Google"})
			return
		}
	}
	
	// Usa i dati dalla richiesta, o quelli modificati dall'admin
	firstName := request.FirstName
	if req.FirstName != "" {
		firstName = req.FirstName
	}
	lastName := request.LastName
	if req.LastName != "" {
		lastName = req.LastName
	}
	phoneNumber := request.PhoneNumber
	if req.PhoneNumber != "" {
		phoneNumber = req.PhoneNumber
	}
	gender := request.Gender
	if req.Gender != "" {
		gender = req.Gender
	}
	
	// Parse birth date - usa quella dalla richiesta o quella modificata
	birthDate := request.BirthDate
	if req.BirthDate != "" {
		parsed, err := time.Parse("2006-01-02", req.BirthDate)
		if err == nil {
			birthDate = &parsed
		}
	}
	
	// Parse next appointment date
	var nextAppointmentDate *time.Time
	if req.NextAppointmentDate != "" {
		parsed, err := time.Parse("2006-01-02", req.NextAppointmentDate)
		if err == nil {
			nextAppointmentDate = &parsed
		}
	}
	
	// Determina is_active e is_admin
	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}
	isAdmin := false
	if req.IsAdmin != nil {
		isAdmin = *req.IsAdmin
	}
	
	// Crea nuovo utente
	newUser := models.User{
		ID:                  database.DB.NextUserID(),
		CreatedAt:           time.Now(),
		UpdatedAt:           time.Now(),
		Email:               request.Email,
		GoogleID:            request.GoogleID,
		FirstName:           firstName,
		LastName:            lastName,
		PhoneNumber:         phoneNumber,
		Gender:              models.Gender(gender),
		BloodType:           req.BloodType,
		BirthDate:           birthDate,
		NextAppointmentDate: nextAppointmentDate,
		IsAdmin:             isAdmin,
		IsActive:            isActive,
		IsSuspended:         false,
	}
	
	database.DB.Users = append(database.DB.Users, newUser)
	
	// Se è stata specificata una data di ultima donazione, crea una donazione
	if req.LastDonationDate != "" {
		parsed, err := time.Parse("2006-01-02", req.LastDonationDate)
		if err == nil {
			donation := models.Donation{
				ID:           database.DB.NextDonationID(),
				CreatedAt:    time.Now(),
				UpdatedAt:    time.Now(),
				DonorID:      newUser.ID,
				DonationDate: parsed,
				Status:       models.DonationStatusCompleted,
				Notes:        "Donazione iniziale importata alla registrazione",
			}
			database.DB.Donations = append(database.DB.Donations, donation)
		}
	}
	
	database.DB.Users = append(database.DB.Users, newUser)
	
	// Aggiorna richiesta
	adminID := c.GetUint("userID")
	now := time.Now()
	database.DB.RegistrationRequests[requestIndex].Status = models.RegistrationRequestStatusApproved
	database.DB.RegistrationRequests[requestIndex].ProcessedBy = &adminID
	database.DB.RegistrationRequests[requestIndex].ProcessedAt = &now
	database.DB.RegistrationRequests[requestIndex].UpdatedAt = now
	
	database.DB.Save()
	
	c.JSON(http.StatusOK, gin.H{
		"message": "Utente creato con successo",
		"user":    newUser,
	})
}

// AssociateRegistrationRequest - Associa richiesta a utente esistente
func AssociateRegistrationRequest(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	
	var req struct {
		UserID uint `json:"user_id"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	// Trova la richiesta
	var requestIndex int = -1
	for i, r := range database.DB.RegistrationRequests {
		if r.ID == uint(id) {
			requestIndex = i
			break
		}
	}
	
	if requestIndex == -1 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Richiesta non trovata"})
		return
	}
	
	if database.DB.RegistrationRequests[requestIndex].Status != models.RegistrationRequestStatusPending {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Richiesta già processata"})
		return
	}
	
	// Trova l'utente e aggiorna GoogleID
	userFound := false
	for i := range database.DB.Users {
		if database.DB.Users[i].ID == req.UserID {
			database.DB.Users[i].GoogleID = database.DB.RegistrationRequests[requestIndex].GoogleID
			database.DB.Users[i].UpdatedAt = time.Now()
			userFound = true
			break
		}
	}
	
	if !userFound {
		c.JSON(http.StatusNotFound, gin.H{"error": "Utente non trovato"})
		return
	}
	
	// Aggiorna richiesta
	adminID := c.GetUint("userID")
	now := time.Now()
	database.DB.RegistrationRequests[requestIndex].Status = models.RegistrationRequestStatusApproved
	database.DB.RegistrationRequests[requestIndex].AssociatedUserID = &req.UserID
	database.DB.RegistrationRequests[requestIndex].ProcessedBy = &adminID
	database.DB.RegistrationRequests[requestIndex].ProcessedAt = &now
	database.DB.RegistrationRequests[requestIndex].UpdatedAt = now
	
	database.DB.Save()
	
	c.JSON(http.StatusOK, gin.H{"message": "Account Google associato all'utente esistente"})
}

// RejectRegistrationRequest - Rifiuta richiesta
func RejectRegistrationRequest(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	
	var req struct {
		Note string `json:"note"`
	}
	c.ShouldBindJSON(&req)
	
	// Trova la richiesta
	var requestIndex int = -1
	for i, r := range database.DB.RegistrationRequests {
		if r.ID == uint(id) {
			requestIndex = i
			break
		}
	}
	
	if requestIndex == -1 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Richiesta non trovata"})
		return
	}
	
	if database.DB.RegistrationRequests[requestIndex].Status != models.RegistrationRequestStatusPending {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Richiesta già processata"})
		return
	}
	
	// Aggiorna richiesta
	adminID := c.GetUint("userID")
	now := time.Now()
	database.DB.RegistrationRequests[requestIndex].Status = models.RegistrationRequestStatusRejected
	database.DB.RegistrationRequests[requestIndex].ProcessedBy = &adminID
	database.DB.RegistrationRequests[requestIndex].ProcessedAt = &now
	database.DB.RegistrationRequests[requestIndex].RejectionNote = req.Note
	database.DB.RegistrationRequests[requestIndex].UpdatedAt = now
	
	database.DB.Save()
	
	c.JSON(http.StatusOK, gin.H{"message": "Richiesta rifiutata"})
}

// DeleteRegistrationRequest - Elimina richiesta
func DeleteRegistrationRequest(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	
	var newRequests []models.RegistrationRequest
	found := false
	for _, r := range database.DB.RegistrationRequests {
		if r.ID == uint(id) {
			found = true
		} else {
			newRequests = append(newRequests, r)
		}
	}
	
	if !found {
		c.JSON(http.StatusNotFound, gin.H{"error": "Richiesta non trovata"})
		return
	}
	
	database.DB.RegistrationRequests = newRequests
	database.DB.Save()
	
	c.JSON(http.StatusOK, gin.H{"message": "Richiesta eliminata"})
}
