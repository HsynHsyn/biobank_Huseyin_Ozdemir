@performance_demo @selection @interaction @critical
Feature: Row selection and cell interaction (dynamic)

    Background:
        Given user opens the AG Grid "Performance" demo page
        And user sees the grid finished rendering

    # Scenario Outline to make row index and column name dynamic
    Scenario Outline: Select visible row <rowIndex> and verify selected state
        When user sees the <rowIndex>th visible row and selects it using the row checkbox
        Then user sees the <rowIndex>th row has the selected state (e.g. class ag-row-selected or aria-selected)

        Examples:
            | rowIndex |
            | 1        |
            | 2        |

    Scenario Outline: Toggle the "<column>" checkbox in the <rowIndex>th row and revert
        Given user sees the <rowIndex>th row is selected
        When user sees the "<column>" cell in the <rowIndex>th row and records its checked state
        And user toggles the "<column>" checkbox in that cell
        Then user sees the "<column>" checkbox state is inverted compared to the recorded state
        When user toggles the "<column>" checkbox again to revert
        Then user sees the "<column>" checkbox has returned to its original state

        Examples:
            | rowIndex | column |
            | 1        | Bought |
            | 2        | Bought |