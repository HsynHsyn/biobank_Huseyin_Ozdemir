@rendering
Feature: Grid data loading and render verification

    Background:
        Given user opens the AG Grid "Performance" demo page
        And user sees the AG Grid root container

    Scenario: Verify that grid container, header and rows are visible
        Then user sees at least one data row rendered in the grid
        Then user sees a footer showing row summary containing "Rows:"
        Then user sees the following column headers:
            | Name         |
            | Language     |
            | Country      |
            | Game Name    |
            | Bought       |
            | Bank Balance |
            | Rating       |


