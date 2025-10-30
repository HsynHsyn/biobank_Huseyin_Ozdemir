@performance_demo @sorting @critical
Feature: Sorting on a column (dynamic)

    Background:
        Given user opens the AG Grid "Performance" demo page
        And user sees the grid finished rendering

    # Scenario Outline lets us run the same sorting check for multiple columns.
    Scenario Outline: Sort "<column>" column ascending then descending
        When user sees the "<column>" column header and clicks it once to sort ascending
        Then user sees the visible "<column>" values in ascending order
        When user sees the "<column>" column header and clicks it again to sort descending
        Then user sees the visible "<column>" values in descending order

        Examples:
            | column    |
            | Name      |
            | Country   |
            | Game Name |