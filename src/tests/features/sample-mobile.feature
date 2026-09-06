Feature: Mobile Application Testing
  As a QA engineer
  I want to test the mobile application
  So that I can verify core functionality on Android devices

  @mobile
  Scenario: App launches successfully
    Given the mobile app is launched
    Then the main screen should be displayed

  @mobile
  Scenario: User can navigate the app
    Given the mobile app is launched
    When the user taps the navigation button
    Then the next screen should be displayed

  @mobile
  Scenario: User can input text
    Given the mobile app is launched
    When the user enters "test input" in the search field
    Then the search field should contain "test input"

  @mobile
  Scenario: User can scroll through content
    Given the mobile app is launched
    When the user scrolls down the page
    Then the bottom content should be visible

  @mobile
  Scenario: App handles back navigation
    Given the mobile app is launched
    When the user navigates to a sub-screen
    And the user presses the back button
    Then the main screen should be displayed
