package handlers

import (
	"bloodone/database"
	"bloodone/models"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

func GetDonations(c *gin.Context) {
	c.JSON(http.StatusOK, database.DB.Donations)
}

func GetDonation(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	for _, d := range database.DB.Donations {
		if d.ID == uint(id) {
			c.JSON(http.StatusOK, d)
			return
		}
	}
	c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
}

func CreateDonation(c *gin.Context) {
	var donation models.Donation
	if err := c.ShouldBindJSON(&donation); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	donation.ID = database.DB.NextDonationID()
	donation.CreatedAt = time.Now()
	donation.Status = models.DonationStatusCompleted
	database.DB.Donations = append(database.DB.Donations, donation)
	database.DB.Save()
	c.JSON(http.StatusCreated, donation)
}

func UpdateDonation(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Updated"})
}

func DeleteDonation(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Deleted"})
}

func GetDonorHistory(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	var donations []models.Donation
	for _, d := range database.DB.Donations {
		if d.DonorID == uint(id) {
			donations = append(donations, d)
		}
	}
	c.JSON(http.StatusOK, donations)
}
