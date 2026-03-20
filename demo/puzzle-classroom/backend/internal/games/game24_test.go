package games

import (
	"testing"
)

func TestGenerateQuestionWithDifficulty(t *testing.T) {
	tests := []struct {
		name       string
		difficulty string
		maxNum     int
	}{
		{"easy", "easy", 9},
		{"medium", "medium", 13},
		{"hard", "hard", 20},
		{"default", "", 13},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			for i := 0; i < 100; i++ {
				numbers := GenerateQuestionWithDifficulty(tt.difficulty)
				if len(numbers) != 4 {
					t.Errorf("Expected 4 numbers, got %d", len(numbers))
				}
				for _, n := range numbers {
					if n < 1 || n > tt.maxNum {
						t.Errorf("Number %d out of range [1, %d]", n, tt.maxNum)
					}
				}
				// For easy and medium, should always be solvable
				if tt.difficulty == "easy" || tt.difficulty == "medium" || tt.difficulty == "" {
					if !hasSolution(numbers) {
						t.Errorf("Generated unsolvable numbers for %s: %v", tt.difficulty, numbers)
					}
				}
			}
		})
	}
}

func TestValidateAnswer(t *testing.T) {
	tests := []struct {
		name     string
		numbers  []int
		answer   string
		expected bool
	}{
		{"simple expression", []int{1, 2, 3, 4}, "1+2+3+4", false}, // 10, not 24
		{"correct expression", []int{1, 2, 3, 4}, "(1+2+3)*4", true}, // 24
		{"steps format semicolon", []int{1, 2, 3, 4}, "1+2=3;3+3=6;6*4=24", true},
		{"steps format comma", []int{1, 2, 3, 4}, "1+2=3, 3+3=6, 6*4=24", true},
		{"wrong result", []int{1, 2, 3, 4}, "1+2=3;3+3=6;6+4=10", false},
		{"wrong numbers", []int{1, 2, 3, 4}, "5+6=11;11+7=18;18+6=24", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := ValidateAnswer(tt.numbers, tt.answer)
			if result != tt.expected {
				t.Errorf("ValidateAnswer(%v, %q) = %v, want %v", tt.numbers, tt.answer, result, tt.expected)
			}
		})
	}
}

func TestHasSolution(t *testing.T) {
	tests := []struct {
		name     string
		numbers  []int
		expected bool
	}{
		{"solvable 1,2,3,4", []int{1, 2, 3, 4}, true},
		{"solvable 1,1,1,1", []int{1, 1, 1, 1}, false}, // Cannot make 24 with all 1s
		{"solvable 2,3,4,6", []int{2, 3, 4, 6}, true},
		{"solvable 8,3,8,3", []int{8, 3, 8, 3}, true}, // 8/(3-8/3) = 24
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := hasSolution(tt.numbers)
			if result != tt.expected {
				t.Errorf("hasSolution(%v) = %v, want %v", tt.numbers, result, tt.expected)
			}
		})
	}
}