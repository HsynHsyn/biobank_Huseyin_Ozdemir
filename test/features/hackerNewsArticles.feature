@wolf
Feature: Validate Hacker News Newest Articles Sorting

    As a QA Engineer I want to ensure that the first 100 articles on Hacker News page are sorted from newest to oldest

    #TODO: Create scenarios that cover all the acceptance criteria
    @wolf
    Scenario: verify that the first 100 articles are sorted from newest to oldest
        Given I open the Hacker News newest page
        When I retrieve the first 100 article timestamps
        Then they should be sorted in descending order