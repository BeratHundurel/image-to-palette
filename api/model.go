package main

import "time"

type User struct {
	ID           uint      `json:"id" gorm:"primaryKey"`
	Name         string    `json:"name" gorm:"size:255;not null"`
	Email        string    `json:"email" gorm:"size:255;uniqueIndex;not null"`
	PasswordHash string    `json:"-" gorm:"size:255;not null"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

type Palette struct {
	ID       uint   `json:"id" gorm:"primaryKey"`
	UserID   *uint  `json:"userId" gorm:"index;foreignKey:UserID;references:ID"`
	JsonData string `json:"jsonData" gorm:"type:jsonb;not null"`
}

