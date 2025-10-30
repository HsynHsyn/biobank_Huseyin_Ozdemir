@performance_demo @filtering @critical
Feature: Text filter on Name column (dynamic)

    Background:
        Given user opens the AG Grid "Performance" demo page
        And user sees the grid finished rendering

    # Use Scenario Outline so the same scenario can run for different columns/tokens
    Scenario Outline: Apply a text filter on the "<column>" column and verify results for "<token>"
        When user sees the floating filter input for the "<column>" column and enters "<token>"
        Then user sees that all visible rows' <column> cells contain "<token>" (case-insensitive)
        When user sees the floating filter input for the "<column>" column and clears it
        Then user sees the grid return to the unfiltered state (original rows visible or rows count increases)

        Examples:
            | column | token  |
            | Name   | Amelia |
            | Name   | Andrew |
            | Name   | Emily  |