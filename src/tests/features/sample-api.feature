Feature: API Testing
  As a QA engineer
  I want to verify the API endpoints
  So that backend functionality is correct

  Scenario: POST data and validate with GET
    Given the API base URL is configured
    When I send a POST request to the create endpoint with valid data
    Then the response status should be 201
    And the response should contain the created resource ID
    When I send a GET request with the created resource ID
    Then the response status should be 200
    And the response data should match the posted data

  Scenario: Validate error handling
    Given the API base URL is configured
    When I send a POST request with invalid data
    Then the response status should be 400
    And the response should contain an error message

  Scenario: Validate GET all records
    Given the API base URL is configured
    When I send a GET request to list all resources
    Then the response status should be 200
    And the response should contain a list of resources
