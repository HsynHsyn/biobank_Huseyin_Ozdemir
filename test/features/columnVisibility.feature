@performance_demo @columns @high
Feature: Column visibility toggle via Columns side panel

    Background:
        Given user opens the AG Grid "Performance" demo page
        And user sees the grid finished rendering

    # Scenario Outline lets you run the same scenario for many column names.
    # Add more rows under Examples to test other columns dynamically.
    Scenario Outline: Hide and show the "<column>" column via the Columns side panel
        When user sees the Columns side panel and sees the "<column>" column toggle control
        And user unchecks the "<column>" column toggle in the panel
        Then user sees the "<column>" header is not present in the grid
        When user checks the "<column>" column toggle in the panel again
        Then user sees the "<column>" header is visible again in the grid

        Examples:
            | column  |
            | Country |
            | Name    |
            | Bought  |
