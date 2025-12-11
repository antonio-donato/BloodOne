package models

import (
	"time"

	"gorm.io/gorm"
)

type Gender string

const (
	GenderMale   Gender = "M"
	GenderFemale Gender = "F"
)

type User struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	// Informazioni base
	Email       string     `gorm:"uniqueIndex;not null" json:"email"`
	GoogleID    string     `gorm:"uniqueIndex" json:"google_id,omitempty"`
	FirstName   string     `gorm:"not null" json:"first_name"`
	LastName    string     `gorm:"not null" json:"last_name"`
	PhoneNumber string     `json:"phone_number"`
	Gender      Gender     `gorm:"type:varchar(1)" json:"gender"`
	BloodType   string     `json:"blood_type"`
	BirthDate   *time.Time `json:"birth_date,omitempty"`

	// Ruolo
	IsAdmin bool `gorm:"default:false" json:"is_admin"`

	// Stato donatore
	IsActive    bool `gorm:"default:true" json:"is_active"`
	IsSuspended bool `gorm:"default:false" json:"is_suspended"`

	// Data prossimo appuntamento confermato
	NextAppointmentDate *time.Time `json:"next_appointment_date,omitempty"`

	// Relazioni
	Donations    []Donation    `gorm:"foreignKey:DonorID" json:"donations,omitempty"`
	Appointments []Appointment `gorm:"foreignKey:DonorID" json:"appointments,omitempty"`
	Suspensions  []Suspension  `gorm:"foreignKey:DonorID" json:"suspensions,omitempty"`
}

type UserResponse struct {
	ID                    uint       `json:"id"`
	Email                 string     `json:"email"`
	FirstName             string     `json:"first_name"`
	LastName              string     `json:"last_name"`
	PhoneNumber           string     `json:"phone_number"`
	Gender                Gender     `json:"gender"`
	BloodType             string     `json:"blood_type"`
	BirthDate             *time.Time `json:"birth_date,omitempty"`
	IsAdmin               bool       `json:"is_admin"`
	IsActive              bool       `json:"is_active"`
	IsSuspended           bool       `json:"is_suspended"`
	TotalDonations        int        `json:"total_donations"`
	LastDonationDate      *time.Time `json:"last_donation_date,omitempty"`
	NextDueDate           *time.Time `json:"next_due_date,omitempty"`
	NextAppointmentDate   *time.Time `json:"next_appointment_date,omitempty"`
	DaysSinceLastDonation int        `json:"days_since_last_donation"`
}

// GetDonationInterval restituisce l'intervallo in mesi tra donazioni in base al sesso
func (u *User) GetDonationInterval() int {
	if u.Gender == GenderMale {
		return 3 // 3 mesi per uomini
	}
	return 6 // 6 mesi per donne
}
