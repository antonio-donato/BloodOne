package handlers

import (
	"bloodone/database"
	"bloodone/models"
	"net/http"
	"net/url"
	"time"

	"encoding/json"
	"io"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

var (
	googleOauthConfig *oauth2.Config
	jwtSecret         = []byte("your-secret-key-change-this-in-production")
)

type Claims struct {
	UserID  uint   `json:"user_id"`
	Email   string `json:"email"`
	IsAdmin bool   `json:"is_admin"`
	jwt.RegisteredClaims
}

func InitOAuth() {
	googleOauthConfig = &oauth2.Config{
		ClientID:     "230024361792-8kle4obojj4k2fp3bok6cah0f6ainrpf.apps.googleusercontent.com",
		ClientSecret: "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",
		RedirectURL:  "http://localhost:8080/api/auth/callback",
		Scopes: []string{
			"https://www.googleapis.com/auth/userinfo.email",
			"https://www.googleapis.com/auth/userinfo.profile",
		},
		Endpoint: google.Endpoint,
	}
}

func GetGoogleLoginURL(c *gin.Context) {
	url := googleOauthConfig.AuthCodeURL("state", oauth2.AccessTypeOffline)
	c.JSON(http.StatusOK, gin.H{"url": url})
}

type GoogleUserInfo struct {
	ID            string `json:"id"`
	Email         string `json:"email"`
	VerifiedEmail bool   `json:"verified_email"`
	Name          string `json:"name"`
	GivenName     string `json:"given_name"`
	FamilyName    string `json:"family_name"`
	Picture       string `json:"picture"`
}

func GoogleCallback(c *gin.Context) {
	code := c.Query("code")
	if code == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Code not provided"})
		return
	}

	token, err := googleOauthConfig.Exchange(c.Request.Context(), code)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to exchange token"})
		return
	}

	client := googleOauthConfig.Client(c.Request.Context(), token)
	resp, err := client.Get("https://www.googleapis.com/oauth2/v2/userinfo")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to get user info"})
		return
	}
	defer resp.Body.Close()

	data, _ := io.ReadAll(resp.Body)
	var userInfo GoogleUserInfo
	json.Unmarshal(data, &userInfo)

	// Cerca utente
	var user *models.User
	found := false

	// Cerca per GoogleID
	for i := range database.DB.Users {
		if database.DB.Users[i].GoogleID == userInfo.ID {
			user = &database.DB.Users[i]
			found = true
			break
		}
	}

	// Se non trovato, cerca per email
	if !found {
		for i := range database.DB.Users {
			if database.DB.Users[i].Email == userInfo.Email {
				user = &database.DB.Users[i]
				user.GoogleID = userInfo.ID
				database.DB.Save()
				found = true
				break
			}
		}
	}

	if !found {
		// Se è il primo utente, crealo come amministratore
		if len(database.DB.Users) == 0 {
			newUser := models.User{
				ID:        database.DB.NextUserID(),
				Email:     userInfo.Email,
				GoogleID:  userInfo.ID,
				FirstName: userInfo.GivenName,
				LastName:  userInfo.FamilyName,
				IsAdmin:   true,
			}
			database.DB.Users = append(database.DB.Users, newUser)
			database.DB.Save()
			user = &database.DB.Users[len(database.DB.Users)-1]
			found = true
		} else {
			// Verifica se esiste già una richiesta pendente
			var pendingRequest *models.RegistrationRequest
			for i := range database.DB.RegistrationRequests {
				if database.DB.RegistrationRequests[i].Email == userInfo.Email && 
				   database.DB.RegistrationRequests[i].Status == models.RegistrationRequestStatusPending {
					pendingRequest = &database.DB.RegistrationRequests[i]
					break
				}
			}
			
			// Utente non registrato - redirect a pagina appropriata
			firstName := userInfo.GivenName
			lastName := userInfo.FamilyName
			
			// Se GivenName è vuoto, usa Name (per account business/aziendali)
			if firstName == "" && userInfo.Name != "" {
				firstName = userInfo.Name
			}
			
			params := url.Values{}
			params.Add("email", userInfo.Email)
			params.Add("google_id", userInfo.ID)
			params.Add("first_name", firstName)
			params.Add("last_name", lastName)
			params.Add("name", userInfo.Name)
			
			if pendingRequest != nil {
				// Ha già una richiesta pendente
				params.Add("pending", "true")
				params.Add("request_date", pendingRequest.CreatedAt.Format("2006-01-02T15:04:05"))
			}
			
			frontendURL := "http://localhost:3000/not-registered?" + params.Encode()
			c.Redirect(http.StatusFound, frontendURL)
			return
		}
	}

	// Genera JWT
	expirationTime := time.Now().Add(24 * time.Hour)
	claims := &Claims{
		UserID:  user.ID,
		Email:   user.Email,
		IsAdmin: user.IsAdmin,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
		},
	}

	jwtToken := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := jwtToken.SignedString(jwtSecret)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	// Redirect al frontend con il token
	frontendURL := "http://localhost:3000/login?token=" + tokenString
	c.Redirect(http.StatusFound, frontendURL)
}
