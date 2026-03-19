package games

import (
	"math/rand"
	"strings"
	"sync"
	"time"
)

// Sudoku difficulty levels - number of givens
var difficultyGivens = map[string]int{
	"easy":      62,
	"medium":    53,
	"hard":      44,
	"very-hard": 35,
	"insane":    26,
	"inhuman":   17,
}

const (
	digits     = "123456789"
	rows       = "ABCDEFGHI"
	nrSquares  = 81
	minGivens  = 17
	blankChar  = '.'
)

var (
	squares          []string
	units            [][]string
	squareUnitsMap   map[string][][]string
	squarePeersMap   map[string][]string
	sudokuRand       *rand.Rand
	sudokuRandMu     sync.Mutex
	sudokuRandOnce   sync.Once
)

// Initialize Sudoku data structures
func initSudoku() {
	if squares != nil {
		return
	}

	// Initialize squares (A1-I9)
	squares = cross(rows, digits)

	// Initialize units (rows, columns, boxes)
	units = getAllUnits(rows, digits)

	// Initialize square units map
	squareUnitsMap = getSquareUnitsMap(squares, units)

	// Initialize square peers map
	squarePeersMap = getSquarePeersMap(squares, squareUnitsMap)
}

// getSudokuRand returns a thread-safe random source for Sudoku
func getSudokuRand() *rand.Rand {
	sudokuRandOnce.Do(func() {
		sudokuRand = rand.New(rand.NewSource(time.Now().UnixNano()))
	})
	return sudokuRand
}

// cross returns cross product of two strings
func cross(a, b string) []string {
	result := make([]string, 0, len(a)*len(b))
	for i := 0; i < len(a); i++ {
		for j := 0; j < len(b); j++ {
			result = append(result, string(a[i])+string(b[j]))
		}
	}
	return result
}

// getAllUnits returns all units (rows, columns, boxes)
func getAllUnits(rows, cols string) [][]string {
	var units [][]string

	// Rows
	for i := 0; i < len(rows); i++ {
		units = append(units, cross(string(rows[i]), cols))
	}

	// Columns
	for i := 0; i < len(cols); i++ {
		units = append(units, cross(rows, string(cols[i])))
	}

	// Boxes
	rowSquares := []string{"ABC", "DEF", "GHI"}
	colSquares := []string{"123", "456", "789"}
	for _, rs := range rowSquares {
		for _, cs := range colSquares {
			units = append(units, cross(rs, cs))
		}
	}

	return units
}

// getSquareUnitsMap returns map of squares to their units
func getSquareUnitsMap(squares []string, units [][]string) map[string][][]string {
	result := make(map[string][][]string)
	for _, sq := range squares {
		var sqUnits [][]string
		for _, unit := range units {
			for _, u := range unit {
				if u == sq {
					sqUnits = append(sqUnits, unit)
					break
				}
			}
		}
		result[sq] = sqUnits
	}
	return result
}

// getSquarePeersMap returns map of squares to their peers
func getSquarePeersMap(squares []string, unitsMap map[string][][]string) map[string][]string {
	result := make(map[string][]string)
	for _, sq := range squares {
		peersMap := make(map[string]bool)
		for _, unit := range unitsMap[sq] {
			for _, u := range unit {
				if u != sq {
					peersMap[u] = true
				}
			}
		}
		peers := make([]string, 0, len(peersMap))
		for p := range peersMap {
			peers = append(peers, p)
		}
		result[sq] = peers
	}
	return result
}

// SudokuPuzzle represents a Sudoku puzzle with puzzle and solution
type SudokuPuzzle struct {
	Puzzle   string `json:"puzzle"`
	Solution string `json:"solution"`
}

// GenerateSudoku generates a new Sudoku puzzle of given difficulty
func GenerateSudoku(difficulty string) SudokuPuzzle {
	initSudoku()

	givens, ok := difficultyGivens[difficulty]
	if !ok {
		givens = difficultyGivens["easy"]
	}

	sudokuRandMu.Lock()
	defer sudokuRandMu.Unlock()

	r := getSudokuRand()

	// Try to generate a valid puzzle
	for {
		puzzle, solution := tryGenerate(r, givens)
		if puzzle != "" {
			return SudokuPuzzle{Puzzle: puzzle, Solution: solution}
		}
	}
}

// tryGenerate attempts to generate a Sudoku puzzle
func tryGenerate(r *rand.Rand, givens int) (string, string) {
	// Start with empty board
	candidates := make(map[string]string)
	for _, sq := range squares {
		candidates[sq] = digits
	}

	// Shuffle squares
	shuffledSquares := make([]string, len(squares))
	copy(shuffledSquares, squares)
	shuffleSlice(r, shuffledSquares)

	// Assign random values to build a complete solution
	for _, sq := range shuffledSquares {
		// Pick random candidate
		cands := candidates[sq]
		if len(cands) == 0 {
			return "", ""
		}
		randIdx := r.Intn(len(cands))
		randCand := string(cands[randIdx])

		// Assign this value
		candidates = assign(candidates, sq, randCand)
		if candidates == nil {
			return "", ""
		}

		// Check if we have a complete puzzle
		singleCount := 0
		for _, sq2 := range squares {
			if len(candidates[sq2]) == 1 {
				singleCount++
			}
		}

		if singleCount >= givens {
			// Build puzzle string
			puzzle := ""
			givenIndices := []int{}
			for i, sq2 := range squares {
				if len(candidates[sq2]) == 1 {
					puzzle += candidates[sq2]
					givenIndices = append(givenIndices, i)
				} else {
					puzzle += string(blankChar)
				}
			}

			// Remove extra givens if needed
			if len(givenIndices) > givens {
				shuffleIntSlice(r, givenIndices)
				puzzleRunes := []rune(puzzle)
				for i := 0; i < len(givenIndices)-givens; i++ {
					puzzleRunes[givenIndices[i]] = blankChar
				}
				puzzle = string(puzzleRunes)
			}

			// Get solution
			solution := solveSudoku(puzzle)
			if solution != "" {
				return puzzle, solution
			}
		}
	}

	return "", ""
}

// solveSudoku solves a Sudoku puzzle
func solveSudoku(board string) string {
	if !validateBoard(board) {
		return ""
	}

	candidates := getCandidatesMap(board)
	if candidates == nil {
		return ""
	}

	result := search(candidates)
	if result == nil {
		return ""
	}

	solution := ""
	for _, sq := range squares {
		solution += result[sq]
	}
	return solution
}

// getCandidatesMap gets all possible candidates for each square
func getCandidatesMap(board string) map[string]string {
	if !validateBoard(board) {
		return nil
	}

	candidates := make(map[string]string)
	for _, sq := range squares {
		candidates[sq] = digits
	}

	for i, sq := range squares {
		val := string(board[i])
		if strings.Contains(digits, val) {
			candidates = assign(candidates, sq, val)
			if candidates == nil {
				return nil
			}
		}
	}

	return candidates
}

// search uses depth-first search to find solution
func search(candidates map[string]string) map[string]string {
	if candidates == nil {
		return nil
	}

	// Check if solved
	maxCands := 0
	for _, sq := range squares {
		if len(candidates[sq]) > maxCands {
			maxCands = len(candidates[sq])
		}
	}
	if maxCands == 1 {
		return candidates
	}

	// Find square with fewest candidates > 1
	minCands := 10
	minSquare := ""
	for _, sq := range squares {
		cands := candidates[sq]
		if len(cands) > 1 && len(cands) < minCands {
			minCands = len(cands)
			minSquare = sq
		}
	}

	// Try each candidate
	for _, val := range candidates[minSquare] {
		candidatesCopy := copyCandidates(candidates)
		result := search(assign(candidatesCopy, minSquare, string(val)))
		if result != nil {
			return result
		}
	}

	return nil
}

// assign assigns a value to a square and propagates constraints
func assign(candidates map[string]string, square, val string) map[string]string {
	otherVals := strings.ReplaceAll(candidates[square], val, "")

	for _, other := range otherVals {
		candidates = eliminate(candidates, square, string(other))
		if candidates == nil {
			return nil
		}
	}

	return candidates
}

// eliminate eliminates a value from a square and propagates
func eliminate(candidates map[string]string, square, val string) map[string]string {
	if !strings.Contains(candidates[square], val) {
		return candidates
	}

	candidates[square] = strings.ReplaceAll(candidates[square], val, "")

	// If no candidates left, contradiction
	if len(candidates[square]) == 0 {
		return nil
	}

	// If only one candidate left, eliminate from peers
	if len(candidates[square]) == 1 {
		targetVal := candidates[square]
		for _, peer := range squarePeersMap[square] {
			candidates = eliminate(candidates, peer, targetVal)
			if candidates == nil {
				return nil
			}
		}
	}

	// Check if value can only be in one place in any unit
	for _, unit := range squareUnitsMap[square] {
		valPlaces := []string{}
		for _, sq := range unit {
			if strings.Contains(candidates[sq], val) {
				valPlaces = append(valPlaces, sq)
			}
		}

		if len(valPlaces) == 0 {
			return nil
		}

		if len(valPlaces) == 1 {
			candidates = assign(candidates, valPlaces[0], val)
			if candidates == nil {
				return nil
			}
		}
	}

	return candidates
}

// copyCandidates creates a deep copy of candidates map
func copyCandidates(candidates map[string]string) map[string]string {
	result := make(map[string]string)
	for k, v := range candidates {
		result[k] = v
	}
	return result
}

// validateBoard validates a Sudoku board string
func validateBoard(board string) bool {
	if len(board) != nrSquares {
		return false
	}
	for _, c := range board {
		if !strings.Contains(digits, string(c)) && c != blankChar {
			return false
		}
	}
	return true
}

// shuffleSlice shuffles a string slice
func shuffleSlice(r *rand.Rand, slice []string) {
	for i := len(slice) - 1; i > 0; i-- {
		j := r.Intn(i + 1)
		slice[i], slice[j] = slice[j], slice[i]
	}
}

// shuffleIntSlice shuffles an int slice
func shuffleIntSlice(r *rand.Rand, slice []int) {
	for i := len(slice) - 1; i > 0; i-- {
		j := r.Intn(i + 1)
		slice[i], slice[j] = slice[j], slice[i]
	}
}

// ValidateSudokuAnswer checks if student's answer matches solution
func ValidateSudokuAnswer(answer, solution string) bool {
	if len(answer) != len(solution) || len(answer) != nrSquares {
		return false
	}
	return answer == solution
}

// CalculateSudokuScore calculates score based on time and difficulty
// Score = baseScore + timeBonus
// baseScore: easy=50, medium=70, hard=100, very-hard=130, insane=160, inhuman=200
// timeBonus: max 50 points, decreases with time
func CalculateSudokuScore(timeSpent int, difficulty string) int {
	baseScore := map[string]int{
		"easy":      50,
		"medium":    70,
		"hard":      100,
		"very-hard": 130,
		"insane":    160,
		"inhuman":   200,
	}

	base := baseScore[difficulty]
	if base == 0 {
		base = 50
	}

	// Time bonus: max 50 points, decreases by 1 for each 30 seconds
	timeBonus := 50 - (timeSpent / 30)
	if timeBonus < 0 {
		timeBonus = 0
	}

	return base + timeBonus
}

// BoardStringToGrid converts board string to 2D array
func BoardStringToGrid(board string) [][]string {
	grid := make([][]string, 9)
	for i := 0; i < 9; i++ {
		grid[i] = make([]string, 9)
		for j := 0; j < 9; j++ {
			grid[i][j] = string(board[i*9+j])
		}
	}
	return grid
}

// BoardGridToString converts 2D array to board string
func BoardGridToString(grid [][]string) string {
	var result strings.Builder
	for i := 0; i < 9; i++ {
		for j := 0; j < 9; j++ {
			if grid[i][j] == "" {
				result.WriteRune(blankChar)
			} else {
				result.WriteString(grid[i][j])
			}
		}
	}
	return result.String()
}