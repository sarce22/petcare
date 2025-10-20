.PHONY: dev compose-up compose-down

# Ejecuta el backend con nodemon
dev:
	@cd app-petcare && npm run dev

# Levanta Docker Compose en modo detach
compose-up:
	@docker compose up -d

# Detiene y elimina los contenedores
compose-down:
	@docker compose down
