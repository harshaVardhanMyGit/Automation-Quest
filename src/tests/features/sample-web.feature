Feature: Web Application Testing
  As a QA engineer
  I want to verify the web application functionality
  So that I can ensure quality

  Background:
    Given the user navigates to the application

  Scenario: Verify homepage loads correctly
    Then the page title should be displayed
    And the navigation menu should be visible

  Scenario: Verify search functionality
    When the user searches for "test query"
    Then search results should be displayed
    And the results count should be greater than 0

  Scenario: Verify data is displayed in table
    When the user navigates to the data page
    Then the data table should be visible
    And the table should have rows

  Scenario Outline: Verify form submission
    When the user fills the form with "<name>" and "<email>"
    And the user submits the form
    Then a success message should be displayed

    Examples:
      | name      | email              |
      | Test User | test@example.com   |
      | Jane Doe  | jane@example.com   |
