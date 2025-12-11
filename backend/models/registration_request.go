package models

import (
	"time"
)

type RegistrationRequestStatus string

const (
	RegistrationRequestStatusPending  RegistrationRequestStatus = "pending"
	RegistrationRequestStatusApproved RegistrationRequestStatus = "approved"
	RegistrationRequestStatusRejected RegistrationRequestStatus = "rejected"
)

type RegistrationRequest struct {
	ID        uint      `json:"id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	// Info da Google
	Email    string `json:"email"`
	GoogleID string `json:"google_id"`

	// Info inserite dall'utente
	FirstName   string     `json:"first_name"`
	LastName    string     `json:"last_name"`
	PhoneNumber string     `json:"phone_number"`
	Gender      string     `json:"gender"`
	BirthDate   *time.Time `json:"birth_date,omitempty"`

	// Stato della richiesta
	Status RegistrationRequestStatus `json:"status"`

	// Se associato a utente esistente
	AssociatedUserID *uint `json:"associated_user_id,omitempty"`

	// Chi ha gestito la richiesta
	ProcessedBy   *uint      `json:"processed_by,omitempty"`
	ProcessedAt   *time.Time `json:"processed_at,omitempty"`
	RejectionNote string     `json:"rejection_note,omitempty"`
}
