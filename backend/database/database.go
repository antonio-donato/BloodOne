package database

// NOTA: Questo file usa SQLite con CGO
// Per Windows senza GCC, usa json_database.go invece
// Vedi WINDOWS_SETUP.md per istruzioni

import (
	"bloodone/models"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"log"
)

var SQLDB *gorm.DB

func ConnectSQL() {
	var err error
	SQLDB, err = gorm.Open(sqlite.Open("bloodone.db"), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	log.Println("SQL Database connected successfully")
}

func MigrateSQL() {
	err := SQLDB.AutoMigrate(
		&models.User{},
		&models.Donation{},
		&models.Appointment{},
		&models.Suspension{},
		&models.DonationSchedule{},
		&models.ExcludedDate{},
		&models.SpecialCapacity{},
	)
	if err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	log.Println("Database migrated successfully")
	
	// Crea configurazione schedule di default se non esiste
	var schedule models.DonationSchedule
	result := SQLDB.First(&schedule)
	if result.Error == gorm.ErrRecordNotFound {
		defaultSchedule := models.DonationSchedule{
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
		SQLDB.Create(&defaultSchedule)
		log.Println("Created default donation schedule")
	}
}
