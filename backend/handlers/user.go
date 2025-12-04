package handlers

import (
	"bloodone/database"
	"bloodone/models"
	"net/http"
	"sort"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

// GetUsers - Lista tutti gli utenti (Admin)
func GetUsers(c *gin.Context) {
	users := database.DB.Users
	var response []models.UserResponse
	for _, user := range users {
		userResp := buildUserResponseSimple(user)
		response = append(response, userResp)
	}
	c.JSON(http.StatusOK, response)
}

// GetUser - Dettagli singolo utente
func GetUser(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	
	for _, user := range database.DB.Users {
		if user.ID == uint(id) {
			userResp := buildUserResponseSimple(user)
			c.JSON(http.StatusOK, userResp)
			return
		}
	}
	c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
}

// GetCurrentUser - Informazioni utente corrente
func GetCurrentUser(c *gin.Context) {
	userID, _ := c.Get("user_id")
	
	for _, user := range database.DB.Users {
		if user.ID == userID.(uint) {
			userResp := buildUserResponseSimple(user)
			c.JSON(http.StatusOK, userResp)
			return
		}
	}
	c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
}

// CreateUser - Crea nuovo utente (Admin)
func CreateUser(c *gin.Context) {
	var input map[string]interface{}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verifica email univoca
	email, ok := input["email"].(string)
	if !ok || email == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email is required"})
		return
	}
	
	for _, u := range database.DB.Users {
		if u.Email == email {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Email already exists"})
			return
		}
	}

	user := models.User{
		ID:          database.DB.NextUserID(),
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
		Email:       email,
		FirstName:   getStringOrEmpty(input, "first_name"),
		LastName:    getStringOrEmpty(input, "last_name"),
		PhoneNumber: getStringOrEmpty(input, "phone_number"),
		BloodType:   getStringOrEmpty(input, "blood_type"),
		IsAdmin:     getBoolOrDefault(input, "is_admin", false),
		IsActive:    getBoolOrDefault(input, "is_active", true),
		IsSuspended: getBoolOrDefault(input, "is_suspended", false),
	}

	// Gender
	if g, ok := input["gender"].(string); ok {
		user.Gender = models.Gender(g)
	}

	// Birth date
	if bd, ok := input["birth_date"].(string); ok && bd != "" {
		if birthDate, err := time.Parse("2006-01-02", bd); err == nil {
			user.BirthDate = &birthDate
		}
	}
	
	database.DB.Users = append(database.DB.Users, user)
	database.DB.Save()

	c.JSON(http.StatusCreated, user)
}

func getStringOrEmpty(m map[string]interface{}, key string) string {
	if v, ok := m[key].(string); ok {
		return v
	}
	return ""
}

func getBoolOrDefault(m map[string]interface{}, key string, def bool) bool {
	if v, ok := m[key].(bool); ok {
		return v
	}
	return def
}

// UpdateUser - Aggiorna utente
func UpdateUser(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	userID, _ := c.Get("user_id")
	isAdmin, _ := c.Get("is_admin")

	if !isAdmin.(bool) && userID.(uint) != uint(id) {
		c.JSON(http.StatusForbidden, gin.H{"error": "You can only update your own profile"})
		return
	}

	var updates map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if !isAdmin.(bool) {
		delete(updates, "is_admin")
		delete(updates, "is_suspended")
	}

	for i, user := range database.DB.Users {
		if user.ID == uint(id) {
			// Aggiorna campi
			if fn, ok := updates["first_name"].(string); ok {
				database.DB.Users[i].FirstName = fn
			}
			if ln, ok := updates["last_name"].(string); ok {
				database.DB.Users[i].LastName = ln
			}
			if pn, ok := updates["phone_number"].(string); ok {
				database.DB.Users[i].PhoneNumber = pn
			}
			if pn, ok := updates["phone"].(string); ok {
				database.DB.Users[i].PhoneNumber = pn
			}
			if bt, ok := updates["blood_type"].(string); ok {
				database.DB.Users[i].BloodType = bt
			}
			if g, ok := updates["gender"].(string); ok {
				database.DB.Users[i].Gender = models.Gender(g)
			}
			if bd, ok := updates["birth_date"].(string); ok {
				if birthDate, err := time.Parse("2006-01-02", bd); err == nil {
					database.DB.Users[i].BirthDate = &birthDate
				}
			}
			if ia, ok := updates["is_active"].(bool); ok {
				database.DB.Users[i].IsActive = ia
			}
			if isAdmin.(bool) {
				if iadmin, ok := updates["is_admin"].(bool); ok {
					database.DB.Users[i].IsAdmin = iadmin
				}
				if isusp, ok := updates["is_suspended"].(bool); ok {
					database.DB.Users[i].IsSuspended = isusp
				}
				
				// Gestione data ultima donazione (solo admin)
				if ldd, ok := updates["last_donation_date"].(string); ok && ldd != "" {
					if donationDate, err := time.Parse("2006-01-02", ldd); err == nil {
						// Cerca se esiste già una donazione per questo utente
						var existingDonation *models.Donation
						for j := range database.DB.Donations {
							if database.DB.Donations[j].DonorID == user.ID {
								existingDonation = &database.DB.Donations[j]
								break
							}
						}
						
						if existingDonation != nil {
							// Aggiorna la donazione esistente
							existingDonation.DonationDate = donationDate
							existingDonation.UpdatedAt = time.Now()
						} else {
							// Crea nuova donazione
							newDonation := models.Donation{
								ID:           database.DB.NextDonationID(),
								CreatedAt:    time.Now(),
								UpdatedAt:    time.Now(),
								DonorID:      user.ID,
								DonationDate: donationDate,
								Status:       models.DonationStatusCompleted,
								Notes:        "Donazione inserita dall'amministratore",
							}
							database.DB.Donations = append(database.DB.Donations, newDonation)
						}
					}
				}
				
				// Gestione prossimo appuntamento (solo admin)
				if nad, ok := updates["next_appointment_date"].(string); ok {
					if nad == "" {
						// Se vuoto, rimuovi l'appuntamento confermato esistente
						for j := range database.DB.Appointments {
							if database.DB.Appointments[j].DonorID == user.ID && 
							   database.DB.Appointments[j].Status == models.AppointmentStatusConfirmed {
								database.DB.Appointments[j].Status = models.AppointmentStatusCancelled
								database.DB.Appointments[j].UpdatedAt = time.Now()
								break
							}
						}
					} else if appointmentDate, err := time.Parse("2006-01-02", nad); err == nil {
						// Cerca se esiste già un appuntamento confermato per questo utente
						var existingAppointment *models.Appointment
						for j := range database.DB.Appointments {
							if database.DB.Appointments[j].DonorID == user.ID && 
							   database.DB.Appointments[j].Status == models.AppointmentStatusConfirmed {
								existingAppointment = &database.DB.Appointments[j]
								break
							}
						}
						
						if existingAppointment != nil {
							// Aggiorna l'appuntamento esistente
							existingAppointment.ConfirmedDate = &appointmentDate
							existingAppointment.UpdatedAt = time.Now()
							existingAppointment.AdminModified = true
							adminID := userID.(uint)
							existingAppointment.ModifiedBy = &adminID
						} else {
							// Crea nuovo appuntamento confermato
							newAppointment := models.Appointment{
								ID:            database.DB.NextAppointmentID(),
								CreatedAt:     time.Now(),
								UpdatedAt:     time.Now(),
								DonorID:       user.ID,
								ConfirmedDate: &appointmentDate,
								Status:        models.AppointmentStatusConfirmed,
								AdminModified: true,
								Notes:         "Appuntamento impostato dall'amministratore",
							}
							adminID := userID.(uint)
							newAppointment.ModifiedBy = &adminID
							database.DB.Appointments = append(database.DB.Appointments, newAppointment)
						}
					}
				}
			}
			database.DB.Users[i].UpdatedAt = time.Now()
			database.DB.Save()
			
			// Restituisci UserResponse con tutti i campi calcolati
			userResp := buildUserResponseSimple(database.DB.Users[i])
			c.JSON(http.StatusOK, userResp)
			return
		}
	}
	c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
}

// DeleteUser - Elimina utente (Admin)
func DeleteUser(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	
	for i, user := range database.DB.Users {
		if user.ID == uint(id) {
			database.DB.Users = append(database.DB.Users[:i], database.DB.Users[i+1:]...)
			database.DB.Save()
			c.JSON(http.StatusOK, gin.H{"message": "User deleted successfully"})
			return
		}
	}
	c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
}

// GetDonorsExpiringSoon - Donatori in scadenza (prossimi 14 giorni) o già scaduti (esclusi sospesi e con appuntamento confermato)
func GetDonorsExpiringSoon(c *gin.Context) {
	var expiring []models.UserResponse
	now := time.Now()
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	twoWeeksFromNow := now.AddDate(0, 0, 14)

	for _, user := range database.DB.Users {
		if !user.IsActive || user.IsSuspended {
			continue
		}
		
		// Verifica se ha già un appuntamento confermato o pending futuro
		hasActiveAppointment := false
		for _, apt := range database.DB.Appointments {
			if apt.DonorID == user.ID && 
			   (apt.Status == models.AppointmentStatusConfirmed || apt.Status == models.AppointmentStatusPending) {
				// Per confermati, verifica che la data sia oggi o futura
				if apt.Status == models.AppointmentStatusConfirmed && apt.ConfirmedDate != nil {
					aptDate := time.Date(apt.ConfirmedDate.Year(), apt.ConfirmedDate.Month(), apt.ConfirmedDate.Day(), 0, 0, 0, 0, apt.ConfirmedDate.Location())
					if !aptDate.Before(today) {
						hasActiveAppointment = true
						break
					}
				}
				// Per pending, basta che esista
				if apt.Status == models.AppointmentStatusPending {
					hasActiveAppointment = true
					break
				}
			}
		}
		
		// Se ha già un appuntamento attivo (confermato o pending), non includerlo
		if hasActiveAppointment {
			continue
		}
		
		userResp := buildUserResponseSimple(user)
		
		// Include: già scaduti (NextDueDate nel passato) O in scadenza nei prossimi 14 giorni
		if userResp.NextDueDate != nil && userResp.NextDueDate.Before(twoWeeksFromNow) {
			expiring = append(expiring, userResp)
		}
	}

	sort.Slice(expiring, func(i, j int) bool {
		return expiring[i].NextDueDate.Before(*expiring[j].NextDueDate)
	})

	c.JSON(http.StatusOK, expiring)
}

func buildUserResponseSimple(user models.User) models.UserResponse {
	resp := models.UserResponse{
		ID:            user.ID,
		Email:         user.Email,
		FirstName:     user.FirstName,
		LastName:      user.LastName,
		PhoneNumber:   user.PhoneNumber,
		Gender:        user.Gender,
		BloodType:     user.BloodType,
		BirthDate:     user.BirthDate,
		IsAdmin:       user.IsAdmin,
		IsActive:      user.IsActive,
		IsSuspended:   user.IsSuspended,
	}

	// Conta donazioni e trova ultima
	var lastDonation *models.Donation
	donationCount := 0
	for _, donation := range database.DB.Donations {
		if donation.DonorID == user.ID && donation.Status == models.DonationStatusCompleted {
			donationCount++
			if lastDonation == nil || donation.DonationDate.After(lastDonation.DonationDate) {
				donation := donation
				lastDonation = &donation
			}
		}
	}
	resp.TotalDonations = donationCount

	if lastDonation != nil {
		resp.LastDonationDate = &lastDonation.DonationDate
		daysSince := int(time.Since(lastDonation.DonationDate).Hours() / 24)
		resp.DaysSinceLastDonation = daysSince

		interval := user.GetDonationInterval()
		
		// Controlla sospensioni attive
		var activeSuspension *models.Suspension
		for _, susp := range database.DB.Suspensions {
			if susp.DonorID == user.ID && susp.IsActive && time.Now().Before(susp.EndDate) {
				susp := susp
				activeSuspension = &susp
				break
			}
		}

		var nextDue time.Time
		if activeSuspension != nil {
			nextDue = activeSuspension.EndDate
		} else {
			nextDue = lastDonation.DonationDate.AddDate(0, interval, 0)
		}
		resp.NextDueDate = &nextDue
	}
	
	// Trova prossimo appuntamento confermato
	now := time.Now()
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	for _, apt := range database.DB.Appointments {
		if apt.DonorID == user.ID && 
		   apt.Status == models.AppointmentStatusConfirmed && 
		   apt.ConfirmedDate != nil {
			// Includi se la data è oggi o nel futuro
			aptDate := time.Date(apt.ConfirmedDate.Year(), apt.ConfirmedDate.Month(), apt.ConfirmedDate.Day(), 0, 0, 0, 0, apt.ConfirmedDate.Location())
			if !aptDate.Before(today) {
				resp.NextAppointmentDate = apt.ConfirmedDate
				break
			}
		}
	}

	return resp
}
