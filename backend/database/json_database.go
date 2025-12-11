package database

import (
	"bloodone/models"
	"encoding/json"
	"log"
	"os"
	"sync"
	"time"
)

var (
	DB     *JSONDatabase
	dbLock sync.RWMutex
)

type JSONDatabase struct {
	Users                []models.User                `json:"users"`
	Donations            []models.Donation            `json:"donations"`
	Appointments         []models.Appointment         `json:"appointments"`
	Suspensions          []models.Suspension          `json:"suspensions"`
	RegistrationRequests []models.RegistrationRequest `json:"registration_requests"`
	Schedule             *models.DonationSchedule     `json:"schedule"`
	ExcludedDates        []models.ExcludedDate        `json:"excluded_dates"`
	SpecialCapacities    []models.SpecialCapacity     `json:"special_capacities"`
	filename             string
}

func Connect() {
	DB = &JSONDatabase{
		Users:                []models.User{},
		Donations:            []models.Donation{},
		Appointments:         []models.Appointment{},
		Suspensions:          []models.Suspension{},
		RegistrationRequests: []models.RegistrationRequest{},
		ExcludedDates:        []models.ExcludedDate{},
		SpecialCapacities:    []models.SpecialCapacity{},
		filename:             "bloodone_data.json",
	}

	// Prova a caricare dati esistenti
	if _, err := os.Stat(DB.filename); err == nil {
		data, err := os.ReadFile(DB.filename)
		if err == nil {
			json.Unmarshal(data, DB)
		}
	}

	log.Println("JSON Database connected successfully (file:", DB.filename, ")")
}

func Migrate() {
	// Crea configurazione schedule di default se non esiste
	if DB.Schedule == nil {
		DB.Schedule = &models.DonationSchedule{
			ID:                1,
			CreatedAt:         time.Now(),
			UpdatedAt:         time.Now(),
			Monday:            true,
			Tuesday:           true,
			Wednesday:         false,
			Thursday:          false,
			Friday:            true,
			Saturday:          false,
			Sunday:            false,
			MondayCapacity:    10,
			TuesdayCapacity:   9,
			WednesdayCapacity: 10,
			ThursdayCapacity:  10,
			FridayCapacity:    10,
			SaturdayCapacity:  10,
			SundayCapacity:    10,
		}
		DB.Save()
	}
	log.Println("Database migrated successfully")
}

func (db *JSONDatabase) Save() error {
	dbLock.Lock()
	defer dbLock.Unlock()

	data, err := json.MarshalIndent(db, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(db.filename, data, 0644)
}

// Helper per generare ID
func (db *JSONDatabase) NextUserID() uint {
	maxID := uint(0)
	for _, u := range db.Users {
		if u.ID > maxID {
			maxID = u.ID
		}
	}
	return maxID + 1
}

func (db *JSONDatabase) NextDonationID() uint {
	maxID := uint(0)
	for _, d := range db.Donations {
		if d.ID > maxID {
			maxID = d.ID
		}
	}
	return maxID + 1
}

func (db *JSONDatabase) NextAppointmentID() uint {
	maxID := uint(0)
	for _, a := range db.Appointments {
		if a.ID > maxID {
			maxID = a.ID
		}
	}
	return maxID + 1
}

func (db *JSONDatabase) NextSuspensionID() uint {
	maxID := uint(0)
	for _, s := range db.Suspensions {
		if s.ID > maxID {
			maxID = s.ID
		}
	}
	return maxID + 1
}

func (db *JSONDatabase) NextExcludedDateID() uint {
	maxID := uint(0)
	for _, e := range db.ExcludedDates {
		if e.ID > maxID {
			maxID = e.ID
		}
	}
	return maxID + 1
}

func (db *JSONDatabase) NextRegistrationRequestID() uint {
	maxID := uint(0)
	for _, r := range db.RegistrationRequests {
		if r.ID > maxID {
			maxID = r.ID
		}
	}
	return maxID + 1
}
