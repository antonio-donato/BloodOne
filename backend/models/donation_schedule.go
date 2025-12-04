package models

import (
	"time"
	"gorm.io/gorm"
)

// DonationSchedule - Configurazione dei giorni disponibili per le donazioni
type DonationSchedule struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
	
	// Giorni della settimana disponibili (0=Domenica, 1=Lunedì, ..., 6=Sabato)
	Monday    bool `gorm:"default:false" json:"monday"`
	Tuesday   bool `gorm:"default:false" json:"tuesday"`
	Wednesday bool `gorm:"default:false" json:"wednesday"`
	Thursday  bool `gorm:"default:false" json:"thursday"`
	Friday    bool `gorm:"default:false" json:"friday"`
	Saturday  bool `gorm:"default:false" json:"saturday"`
	Sunday    bool `gorm:"default:false" json:"sunday"`
	
	// Capacità massima per giorno della settimana
	MondayCapacity    int `gorm:"default:10" json:"monday_capacity"`
	TuesdayCapacity   int `gorm:"default:10" json:"tuesday_capacity"`
	WednesdayCapacity int `gorm:"default:10" json:"wednesday_capacity"`
	ThursdayCapacity  int `gorm:"default:10" json:"thursday_capacity"`
	FridayCapacity    int `gorm:"default:10" json:"friday_capacity"`
	SaturdayCapacity  int `gorm:"default:10" json:"saturday_capacity"`
	SundayCapacity    int `gorm:"default:10" json:"sunday_capacity"`
}

// ExcludedDate - Date specifiche escluse (festività, ecc.)
type ExcludedDate struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
	
	Date      time.Time      `gorm:"uniqueIndex;not null" json:"date"`
	Reason    string         `json:"reason"`
}

// SpecialCapacity - Capacità personalizzata per date specifiche
type SpecialCapacity struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
	
	Date      time.Time      `gorm:"uniqueIndex;not null" json:"date"`
	Capacity  int            `gorm:"not null" json:"capacity"`
}
