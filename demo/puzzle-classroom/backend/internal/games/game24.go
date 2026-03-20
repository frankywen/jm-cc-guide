package games

import (
	"math"
	"math/rand"
	"regexp"
	"strconv"
	"strings"
	"sync"
	"time"
)

var (
	globalRand     *rand.Rand
	globalRandMu   sync.Mutex
	globalRandOnce sync.Once
)

// getGlobalRand returns a thread-safe global random source
func getGlobalRand() *rand.Rand {
	globalRandOnce.Do(func() {
		globalRand = rand.New(rand.NewSource(time.Now().UnixNano()))
	})
	return globalRand
}

// GenerateQuestion generates 4 random numbers (1-13) for the 24-point game
func GenerateQuestion() []int {
	globalRandMu.Lock()
	defer globalRandMu.Unlock()

	r := getGlobalRand()
	numbers := make([]int, 4)
	for i := 0; i < 4; i++ {
		numbers[i] = r.Intn(13) + 1
	}
	return numbers
}

// ValidateAnswer checks if the answer uses exactly the 4 numbers and equals 24
func ValidateAnswer(numbers []int, answer string) bool {
	// Try to parse as operation steps format first (e.g., "1+2=3;3*4=12;3+12=15;15+9=24")
	if strings.Contains(answer, "=") && strings.Contains(answer, ";") {
		return validateOperationSteps(numbers, answer)
	}

	// Also support comma-separated steps format (e.g., "1+2=3, 3*4=12")
	if strings.Contains(answer, "=") && strings.Contains(answer, ",") {
		return validateOperationStepsComma(numbers, answer)
	}

	// Extract all numbers from the answer (for math expression format)
	re := regexp.MustCompile(`\d+`)
	matches := re.FindAllString(answer, -1)
	if len(matches) != 4 {
		return false
	}

	// Count occurrences of each number in the answer
	answerNums := make(map[int]int)
	for _, m := range matches {
		n, err := strconv.Atoi(m)
		if err != nil {
			return false
		}
		answerNums[n]++
	}

	// Count occurrences of each number in the question
	questionNums := make(map[int]int)
	for _, n := range numbers {
		questionNums[n]++
	}

	// Verify the numbers match
	for k, v := range questionNums {
		if answerNums[k] != v {
			return false
		}
	}

	// Evaluate the expression
	result, err := safeEval(strings.ReplaceAll(answer, " ", ""))
	if err != nil {
		return false
	}

	return result == 24
}

// validateOperationSteps validates answer in operation steps format (semicolon-separated)
func validateOperationSteps(numbers []int, answer string) bool {
	// Parse operations like "1+2=3;3*4=12;3+12=15;15+9=24"
	steps := strings.Split(answer, ";")
	if len(steps) == 0 {
		return false
	}

	// Track available numbers (starting with question numbers)
	availableNums := make(map[float64]int)
	for _, n := range numbers {
		availableNums[float64(n)]++
	}

	for i, step := range steps {
		step = strings.TrimSpace(step)
		if step == "" {
			continue
		}

		// Parse step: "1+2=3"
		parts := strings.Split(step, "=")
		if len(parts) != 2 {
			return false
		}

		expr := strings.TrimSpace(parts[0])
		resultStr := strings.TrimSpace(parts[1])

		// Extract numbers from expression
		re := regexp.MustCompile(`[\d.]+`)
		numMatches := re.FindAllString(expr, -1)
		if len(numMatches) != 2 {
			return false
		}

		num1, err := strconv.ParseFloat(numMatches[0], 64)
		if err != nil {
			return false
		}
		num2, err := strconv.ParseFloat(numMatches[1], 64)
		if err != nil {
			return false
		}
		result, err := strconv.ParseFloat(resultStr, 64)
		if err != nil {
			return false
		}

		// Find operator
		var op byte
		for j := 0; j < len(expr); j++ {
			if expr[j] == '+' || expr[j] == '-' || expr[j] == '*' || expr[j] == '/' {
				op = expr[j]
				break
			}
		}

		// Verify the operation result
		var calcResult float64
		switch op {
		case '+':
			calcResult = num1 + num2
		case '-':
			calcResult = num1 - num2
		case '*':
			calcResult = num1 * num2
		case '/':
			if num2 == 0 {
				return false
			}
			calcResult = num1 / num2
		default:
			return false
		}

		// Allow small floating point errors
		if math.Abs(calcResult-result) > 0.01 {
			return false
		}

		// For the first step, verify numbers are from original question
		if i == 0 {
			// Decrement count for used numbers
			if availableNums[num1] > 0 {
				availableNums[num1]--
			} else {
				return false
			}
			if availableNums[num2] > 0 {
				availableNums[num2]--
			} else {
				return false
			}
		}

		// Add result to available numbers
		availableNums[result]++
	}

	// Final result should be 24
	return availableNums[24] > 0
}

// validateOperationStepsComma validates answer in operation steps format (comma-separated)
func validateOperationStepsComma(numbers []int, answer string) bool {
	// Parse operations like "1+2=3, 3*4=12"
	steps := strings.Split(answer, ",")
	if len(steps) == 0 {
		return false
	}

	// Track available numbers (starting with question numbers)
	availableNums := make(map[float64]int)
	for _, n := range numbers {
		availableNums[float64(n)]++
	}

	for i, step := range steps {
		step = strings.TrimSpace(step)
		if step == "" {
			continue
		}

		// Parse step: "1+2=3"
		parts := strings.Split(step, "=")
		if len(parts) != 2 {
			return false
		}

		expr := strings.TrimSpace(parts[0])
		resultStr := strings.TrimSpace(parts[1])

		// Extract numbers from expression
		re := regexp.MustCompile(`[\d.]+`)
		numMatches := re.FindAllString(expr, -1)
		if len(numMatches) != 2 {
			return false
		}

		num1, err := strconv.ParseFloat(numMatches[0], 64)
		if err != nil {
			return false
		}
		num2, err := strconv.ParseFloat(numMatches[1], 64)
		if err != nil {
			return false
		}
		result, err := strconv.ParseFloat(resultStr, 64)
		if err != nil {
			return false
		}

		// Find operator
		var op byte
		for j := 0; j < len(expr); j++ {
			if expr[j] == '+' || expr[j] == '-' || expr[j] == '*' || expr[j] == '/' {
				op = expr[j]
				break
			}
		}

		// Verify the operation result
		var calcResult float64
		switch op {
		case '+':
			calcResult = num1 + num2
		case '-':
			calcResult = num1 - num2
		case '*':
			calcResult = num1 * num2
		case '/':
			if num2 == 0 {
				return false
			}
			calcResult = num1 / num2
		default:
			return false
		}

		// Allow small floating point errors
		if math.Abs(calcResult-result) > 0.01 {
			return false
		}

		// For the first step, verify numbers are from original question
		if i == 0 {
			if availableNums[num1] > 0 {
				availableNums[num1]--
			} else {
				return false
			}
			if availableNums[num2] > 0 {
				availableNums[num2]--
			} else {
				return false
			}
		}

		// Add result to available numbers
		availableNums[result]++
	}

	// Final result should be 24
	return availableNums[24] > 0
}

// safeEval safely evaluates a mathematical expression
func safeEval(expr string) (float64, error) {
	var nums []float64
	var ops []byte

	// Handle negative numbers at the start or after opening parenthesis
	expr = strings.ReplaceAll(expr, "(-", "(0-")
	if len(expr) > 0 && expr[0] == '-' {
		expr = "0" + expr
	}

	for i := 0; i < len(expr); {
		if expr[i] >= '0' && expr[i] <= '9' {
			// Parse number
			j := i
			for j < len(expr) && (expr[j] >= '0' && expr[j] <= '9' || expr[j] == '.') {
				j++
			}
			num, err := strconv.ParseFloat(expr[i:j], 64)
			if err != nil {
				return 0, err
			}
			nums = append(nums, num)
			i = j
		} else if expr[i] == '(' {
			ops = append(ops, '(')
			i++
		} else if expr[i] == ')' {
			// Process until matching opening parenthesis
			for len(ops) > 0 && ops[len(ops)-1] != '(' {
				if err := calc(&nums, &ops); err != nil {
					return 0, err
				}
			}
			if len(ops) == 0 {
				return 0, strconv.ErrSyntax
			}
			ops = ops[:len(ops)-1] // Remove the '('
			i++
		} else if expr[i] == '+' || expr[i] == '-' || expr[i] == '*' || expr[i] == '/' {
			// Process operators with higher or equal priority
			for len(ops) > 0 && priority(ops[len(ops)-1]) >= priority(expr[i]) {
				if err := calc(&nums, &ops); err != nil {
					return 0, err
				}
			}
			ops = append(ops, expr[i])
			i++
		} else {
			i++ // Skip unknown characters
		}
	}

	// Process remaining operators
	for len(ops) > 0 {
		if err := calc(&nums, &ops); err != nil {
			return 0, err
		}
	}

	if len(nums) != 1 {
		return 0, strconv.ErrSyntax
	}

	return nums[0], nil
}

// priority returns the precedence of an operator
func priority(op byte) int {
	if op == '+' || op == '-' {
		return 1
	}
	if op == '*' || op == '/' {
		return 2
	}
	return 0
}

// calc performs a single calculation
func calc(nums *[]float64, ops *[]byte) error {
	if len(*nums) < 2 || len(*ops) < 1 {
		return strconv.ErrSyntax
	}

	b := (*nums)[len(*nums)-1]
	a := (*nums)[len(*nums)-2]
	*nums = (*nums)[:len(*nums)-2]

	op := (*ops)[len(*ops)-1]
	*ops = (*ops)[:len(*ops)-1]

	var result float64
	switch op {
	case '+':
		result = a + b
	case '-':
		result = a - b
	case '*':
		result = a * b
	case '/':
		if b == 0 {
			return strconv.ErrSyntax
		}
		result = a / b
	default:
		return strconv.ErrSyntax
	}

	*nums = append(*nums, result)
	return nil
}

// CalculateScore calculates the score based on time spent
// Score = 100 - timeSpent (minimum 10)
func CalculateScore(timeSpent int) int {
	score := 100 - timeSpent
	if score < 10 {
		score = 10
	}
	return score
}