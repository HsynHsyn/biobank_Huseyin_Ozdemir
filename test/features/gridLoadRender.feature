@performance_demo @smoke @critical
Feature: Grid data loading and render verification

    Background:
        Given user opens the AG Grid "Performance" demo page

    Scenario: Grid container, header and rows are visible
        When user sees the AG Grid root container
        Then user sees the grid header with column labels
        And user sees at least one data row rendered in the grid
        And user sees a footer showing row summary containing "Rows:"
        And user sees no unhandled console errors during load

    Scenario: Critical columns are present after initial render
        When user sees the grid finished rendering
        Then user sees the following column headers: "Name", "Language", "Country", "Game Name", "Bought", "Bank Balance", "Rating"