package models

import (
	"time"
	"gorm.io/gorm"
)

type DonationStatus string

const (
	DonationStatusCompleted DonationStatus = "completed"
	DonationStatusCancelled DonationStatus = "cancelled"
)

type Donation struct {
	ID         uint           `gorm:"primarykey" json:"id"`
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
	DeletedAt  gorm.DeletedAt `gorm:"index" json:"-"`
	
	// Riferimenti
	DonorID    uint           `gorm:"not null;index" json:"donor_id"`
	Donor      User           `gorm:"foreignKey:DonorID" json:"donor,omitempty"`
	
	// Dettagli donazione
	DonationDate time.Time     `gorm:"not null;index" json:"donation_date"`
	Status       DonationStatus `gorm:"type:varchar(20);default:'completed'" json:"status"`
	Notes        string         `json:"notes"`
}
