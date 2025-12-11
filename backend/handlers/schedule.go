package handlers

import (
	"bloodone/database"
	"bloodone/models"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

func GetSchedule(c *gin.Context) {
	c.JSON(http.StatusOK, database.DB.Schedule)
}

func UpdateSchedule(c *gin.Context) {
	var schedule models.DonationSchedule
	if err := c.ShouldBindJSON(&schedule); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Mantieni l'ID e i timestamp
	schedule.ID = database.DB.Schedule.ID
	schedule.CreatedAt = database.DB.Schedule.CreatedAt
	schedule.UpdatedAt = time.Now()

	database.DB.Schedule = &schedule
	database.DB.Save()
	c.JSON(http.StatusOK, database.DB.Schedule)
}

func GetExcludedDates(c *gin.Context) {
	c.JSON(http.StatusOK, database.DB.ExcludedDates)
}

func AddExcludedDate(c *gin.Context) {
	var req struct {
		Date   string `json:"date"`
		Reason string `json:"reason"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	parsedDate, err := time.Parse("2006-01-02", req.Date)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Formato data non valido"})
		return
	}

	// Verifica duplicati
	for _, ed := range database.DB.ExcludedDates {
		if ed.Date.Format("2006-01-02") == req.Date {
			c.JSON(http.StatusConflict, gin.H{"error": "Data già esclusa"})
			return
		}
	}

	date := models.ExcludedDate{
		ID:        database.DB.NextExcludedDateID(),
		CreatedAt: time.Now(),
		Date:      parsedDate,
		Reason:    req.Reason,
	}
	database.DB.ExcludedDates = append(database.DB.ExcludedDates, date)
	database.DB.Save()
	c.JSON(http.StatusCreated, date)
}

func DeleteExcludedDate(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)

	for i, ed := range database.DB.ExcludedDates {
		if ed.ID == uint(id) {
			database.DB.ExcludedDates = append(database.DB.ExcludedDates[:i], database.DB.ExcludedDates[i+1:]...)
			database.DB.Save()
			c.JSON(http.StatusOK, gin.H{"message": "Eliminato"})
			return
		}
	}
	c.JSON(http.StatusNotFound, gin.H{"error": "Non trovato"})
}

func GetSpecialCapacities(c *gin.Context) {
	c.JSON(http.StatusOK, database.DB.SpecialCapacities)
}

func SetSpecialCapacity(c *gin.Context) {
	var capacity models.SpecialCapacity
	if err := c.ShouldBindJSON(&capacity); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	capacity.CreatedAt = time.Now()
	database.DB.SpecialCapacities = append(database.DB.SpecialCapacities, capacity)
	database.DB.Save()
	c.JSON(http.StatusCreated, capacity)
}

func DeleteSpecialCapacity(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Deleted"})
}

func GetSuspensions(c *gin.Context) {
	c.JSON(http.StatusOK, database.DB.Suspensions)
}

func CreateSuspension(c *gin.Context) {
	adminID, _ := c.Get("user_id")
	var suspension models.Suspension
	if err := c.ShouldBindJSON(&suspension); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	suspension.ID = database.DB.NextSuspensionID()
	suspension.CreatedBy = adminID.(uint)
	suspension.IsActive = true
	suspension.EndDate = suspension.StartDate.AddDate(0, suspension.DurationMonths, 0)
	suspension.CreatedAt = time.Now()

	// Aggiorna stato utente
	for i, u := range database.DB.Users {
		if u.ID == suspension.DonorID {
			database.DB.Users[i].IsSuspended = true
			break
		}
	}

	database.DB.Suspensions = append(database.DB.Suspensions, suspension)
	database.DB.Save()
	c.JSON(http.StatusCreated, suspension)
}

func EndSuspension(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	for i, s := range database.DB.Suspensions {
		if s.ID == uint(id) {
			database.DB.Suspensions[i].IsActive = false
			database.DB.Suspensions[i].EndDate = time.Now()

			// Aggiorna stato utente
			for j, u := range database.DB.Users {
				if u.ID == s.DonorID {
					database.DB.Users[j].IsSuspended = false
					break
				}
			}

			database.DB.Save()
			c.JSON(http.StatusOK, database.DB.Suspensions[i])
			return
		}
	}
	c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
}
