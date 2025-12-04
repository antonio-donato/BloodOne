package models

import (
	"time"
	"gorm.io/gorm"
)

type AppointmentStatus string

const (
	AppointmentStatusPending   AppointmentStatus = "pending"    // In attesa di conferma donatore
	AppointmentStatusConfirmed AppointmentStatus = "confirmed"  // Confermato dal donatore
	AppointmentStatusCompleted AppointmentStatus = "completed"  // Donazione completata
	AppointmentStatusCancelled AppointmentStatus = "cancelled"  // Annullato
)

type Appointment struct {
	ID        uint              `gorm:"primarykey" json:"id"`
	CreatedAt time.Time         `json:"created_at"`
	UpdatedAt time.Time         `json:"updated_at"`
	DeletedAt gorm.DeletedAt    `gorm:"index" json:"-"`
	
	// Riferimenti
	DonorID   uint              `gorm:"not null;index" json:"donor_id"`
	Donor     User              `gorm:"foreignKey:DonorID" json:"donor,omitempty"`
	
	// Date proposte (3 opzioni)
	ProposedDate1 time.Time     `json:"proposed_date_1"`
	ProposedDate2 time.Time     `json:"proposed_date_2"`
	ProposedDate3 time.Time     `json:"proposed_date_3"`
	
	// Data confermata
	ConfirmedDate *time.Time    `json:"confirmed_date,omitempty"`
	
	// Stato
	Status        AppointmentStatus `gorm:"type:varchar(20);default:'pending'" json:"status"`
	
	// Flag per modifiche amministrative
	AdminModified bool          `gorm:"default:false" json:"admin_modified"`
	ModifiedBy    *uint         `json:"modified_by,omitempty"` // ID dell'admin che ha modificato
	
	// Note
	Notes         string        `json:"notes"`
	
	// Notifica inviata
	NotificationSent bool       `gorm:"default:false" json:"notification_sent"`
}
