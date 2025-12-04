package models

import (
	"time"
	"gorm.io/gorm"
)

type Suspension struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
	
	// Riferimenti
	DonorID   uint           `gorm:"not null;index" json:"donor_id"`
	Donor     User           `gorm:"foreignKey:DonorID" json:"donor,omitempty"`
	
	// Dettagli sospensione
	StartDate      time.Time  `gorm:"not null" json:"start_date"`
	DurationMonths int        `gorm:"not null" json:"duration_months"`
	EndDate        time.Time  `gorm:"not null" json:"end_date"`
	Reason         string     `gorm:"not null" json:"reason"`
	
	// Stato
	IsActive       bool       `gorm:"default:true" json:"is_active"`
	
	// Chi ha creato la sospensione
	CreatedBy      uint       `json:"created_by"`
}
