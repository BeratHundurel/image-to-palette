.PHONY: api web install build clean test bench help

# Run API server
api:
	cd api && go run .

# Run frontend server
web:
	cd frontend && npm run dev

# Install dependencies
install:
	cd api && go mod tidy
	cd frontend && npm install

# Build the project
build:
	cd api && go build -o image-to-palette.exe
	cd frontend && npm run build

# Clean build artifacts
clean:
	@if exist api\*.exe del /Q api\*.exe
	@if exist frontend\build rmdir /S /Q frontend\build
	@if exist frontend\.svelte-kit rmdir /S /Q frontend\.svelte-kit

# Test API
test:
	cd api && go test ./...

# Run API benchmarks
bench:
	cd api && go test -bench=. ./...

# Help
help:
	@echo Available targets:
	@echo   api      - Run API server
	@echo   web      - Run frontend server
	@echo   install  - Install all dependencies
	@echo   build    - Build the entire project
	@echo   clean    - Clean build artifacts
	@echo   test     - Run API tests
	@echo   bench    - Run API benchmarks
	@echo   help     - Show this help message
