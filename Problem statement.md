TestAutothon 2026 
Event Details 
Total Challenge Duration: 5 hours 
Time: 10:00 AM–3:00 PM IST 
Submission Deadline: All deliverables must be submitted by 2:59 PM IST. 
Required Deliverables 
Each team must submit: 
1. Automation framework and execution report using GitHub repository link. 
Repository Naming Convention:  
TeamName-TestAutothon26-AutomationFramework 
You are free to use any automation framework or programming language. Make sure 
if you are using proprietary framework which cannot be uploaded on GitHub you 
inform the judges/organizers at the start of the hackathon. 
2. Test strategy document and bug report to the respective team folders in the google 
drive link provided.  
Google Drive URL has been emailed to you by Team STeP_IN. If you have not 
received it, please contact the volunteers for help. 
Document Naming Convention:  
TeamName_TestAutothon26_TestStrategy 
TeamName_TestAutothon26_BugReport 
Format: Can be Word, PDF or Excel 
Late or incomplete submissions may not be considered for evaluation. Both Submissions are 
mandatory 
© 2026 STeP-IN Forum. All Rights Reserved. 
Challenge Tracks and Prizes 
Automation Quest 
The Automation Quest will have two winning teams. Automation frameworks will be 
evaluated by the STeP-IN judging panel. 
• Winner: ₹1,00,000 
• Runner-up: ₹70,000 
The top eight teams will be selected by the judges on Day1 and invited for the next 
evaluation round on Day 2. 
Bug Quest 
The Bug Quest will have three winning teams. Test strategies and bug reports will be 
evaluated by the Gajab team. 
• Winner: ₹15,000 
• Runner-up: ₹12,500 
• Second Runner-up: ₹10,000 
Double-Win Opportunity 
Teams should mandatorily participate in both tracks and are eligible to win prizes in both the 
Automation Quest and the Bug Quest separately  
General Challenge Instructions 
Your team has two challenges to tackle: 
1. Build a robust automation framework for the application under test. 
2. Create a comprehensive test strategy and identify meaningful product defects. 
You may divide your team into smaller groups and work on both challenges in parallel. How 
you organize your team and allocate your time is entirely up to you. 
As a general recommendation, teams may consider spending approximately: 
• Three hours on the Automation Quest 
• Two hours on the Bug Quest 
This is only a recommendation. Teams are free to follow any strategy they believe will 
produce the strongest submission. 
© 2026 STeP-IN Forum. All Rights Reserved. 
Use of AI 
The use of AI is strongly encouraged throughout the TestAutothon. 
Teams should use AI wherever it can meaningfully accelerate planning, development, 
execution, analysis, or reporting. AI may be used to: 
• Generate or improve the test strategy 
• Identify test scenarios and edge cases 
• Design the automation framework 
• Generate or refactor automation code 
• Create test data 
• Diagnose test failures 
• Build self-healing automation capabilities 
• Perform accessibility, security, performance, or visual analysis 
• Summarize test results 
• Generate dashboards and execution insights 
• Analyze defects and estimate business impact 
• Improve bug descriptions and reproduction steps 
• Generate product recommendations 
AI usage alone will not guarantee additional points. Judges will evaluate how appropriately, 
effectively, and responsibly AI has been incorporated. 
Teams must understand, review, validate, and be able to explain all AI-generated work to the 
judges. Submissions containing unverified or non-functional AI-generated content may lose 
points. 
AI Usage Report 
Teams must disclose to the judges: 
• AI tools and models used 
• The tasks for which AI was used 
• Important prompts or prompt sequences 
• AI-generated outputs incorporated into the submission 
• How those outputs were reviewed or validated 
• Errors, limitations, or hallucinations identified 
• Time saved or improvements achieved through AI 
Reminder: Teams should never include passwords, OTPs, personal data, credentials, 
proprietary information, or other sensitive data in public AI tools or submitted prompts. 
© 2026 STeP-IN Forum. All Rights Reserved. 
Challenge 1: Automation Quest 
Application Under Test 
Gajab India’s Bargain Bazar 
https://stg.gajab.com/ 
(Please do not use production URL for testing/hackathon) 
Business Workflow to Automate 
Automate the following end-to-end customer journey: 
1. Navigate to Gajab website. 
2. Click on Log in or sign-up button. 
3. Enter Mobile number and request an OTP. 
4. Enter the Default OTP – 123456 and click on submit. Verify the login successful 
message. 
© 2026 STeP-IN Forum. All Rights Reserved. 
5. Enter the Pin code and make sure it is reflected upon selection. 
6. Capture the Gajab Deal of the Day. 
7. Email the product image, product name, and asking price to your email address. 
8. Identify the most-bargained product under Trending Products. (If there are two 
products with the same bargains. Pick the one occurring first in the scroll.) 
© 2026 STeP-IN Forum. All Rights Reserved. 
9. Verify the latest live order. Fetch the name and the city of the person picked. Capture 
a screenshot as well. 
10. Click on View All link in the Just Bargained Product section and identify the cheapest 
product among the most-bargained products. 
11. Open the Toys & Games category tab. 
© 2026 STeP-IN Forum. All Rights Reserved. 
12. Select SERA’S BASKET as the brand from the left filter. 
13. Set the price range from ₹427 to ₹727. 
14. Select Classic 15.7 Inch Soft Tip Dartboard Game Set. 
© 2026 STeP-IN Forum. All Rights Reserved. 
15. Click on the product and start bargaining. 
16. Keep Bargaining till 3 attempts. Accept the offer. 
17. Click on By Now 
© 2026 STeP-IN Forum. All Rights Reserved. 
18. Select payment method as “Pay Online” and Click on Pay. 
19. Choose Net banking and select any bank 
20. Click on Success button and confirm payment 
© 2026 STeP-IN Forum. All Rights Reserved. 
21. Verify your order has been placed. 
22. Open My Bargains and verify the savings. 
If a specified product, price, filter, or test dependency is unavailable during the event, teams 
must document the issue and demonstrate a reasonable fallback approach. Judges will 
consider the quality of the handling rather than penalizing teams for genuine environment 
limitations. 
Automation Expectations 
Teams should aim to demonstrate as many of the following capabilities as possible: 
Framework Design 
• A clean, modular, reusable, and maintainable framework 
• Clear separation of test logic, test data, configuration, and page or component objects 
• Parameterized scenarios 
• Meaningful naming conventions and project structure 
• Proper exception handling and recovery mechanisms 
• Secure handling of OTPs, credentials, and environment configuration 
Test Data 
• Test data sourced from an Excel file 
• Externalized configuration and environment values 
• Data-driven execution 
• Support for both positive and negative datasets 
© 2026 STeP-IN Forum. All Rights Reserved. 
Language Coverage 
Execute the workflow in: 
• English 
• Hinglish 
Browser Coverage 
Demonstrate execution on: 
• Google Chrome 
• Mozilla Firefox 
• Microsoft Edge 
Device and Platform Coverage 
Demonstrate or provide an executable approach for: 
• Web 
• Android 
Your apk file can be downloaded from below link
https://drive.google.com/file/d/1_3vz21k4VWJwfCNSHHW-lVkMpP7IarPe/view 
(Please do not use production mobile app) 
Simulators, emulators, device clouds, or equivalent approaches may be used. Teams must 
clearly identify which executions were completed and which were demonstrated through 
configuration or design. 
© 2026 STeP-IN Forum. All Rights Reserved. 
Non-Functional Quality 
Include relevant checks for: 
• Accessibility 
• Performance 
• Security 
• Visual regression or page comparison 
The depth, relevance, and accuracy of these checks will matter more than the number of tools 
included. 
Reporting and DevOps 
The solution should include: 
• Clear execution reports 
• Screenshots or videos for important steps and failures 
• Logs with useful diagnostic information 
• Pass/fail summaries 
• Defect or anomaly reporting 
• CI/CD integration 
• Instructions for local and pipeline execution 
Source-Code Submission 
Where the framework is not proprietary, teams should check the project into their GitHub 
profile and submit the repository link. 
The submission will be reviewed by the judging panel and shared with the event’s platform 
sponsor for evaluation purposes. Do not submit employer-owned, customer-owned, 
confidential, licensed, or proprietary code. 
The repository should include: 
• Source code 
• README and setup instructions 
• Dependency details 
• Test-data template 
• Execution commands 
• Sample reports 
• CI/CD configuration 
• AI Usage Report 
• Known limitations 
© 2026 STeP-IN Forum. All Rights Reserved. 
Challenge 2: Bug Quest 
The objective of the Bug Quest is to evaluate how effectively your team can understand the 
product, develop a risk-based testing approach, identify meaningful defects, and 
communicate findings to the product team. 
Task 1: Create a Test Strategy 
Create a test strategy for the application with the appropriate business and technical context. 
The strategy should include: 
• Product and user understanding 
• Testing objectives 
• Scope and out-of-scope areas 
• Assumptions and dependencies 
• Risk assessment 
• User personas and critical journeys 
• Functional test scenarios 
• Negative and boundary scenarios 
• Cross-browser and device coverage 
• Accessibility considerations 
• Performance considerations 
• Security and privacy considerations 
• Test-data requirements 
• Entry and exit criteria 
• Execution approach 
• Prioritization methodology 
• Known limitations 
You are encouraged to use AI to develop or improve your strategy. Include the important 
prompts used and explain how the AI-generated recommendations were reviewed. 
Task 2: Execute the Test Strategy 
Use the strategy to perform your test run. 
You may use: 
• Exploratory testing 
• Manual testing 
• Your existing automation framework 
• Newly created automation 
• Browser development tools 
• Accessibility tools 
• Performance tools 
• Security-testing tools 
• AI-assisted testing tools 
© 2026 STeP-IN Forum. All Rights Reserved. 
Teams should prioritize high-risk user journeys and areas that could affect revenue, trust, 
privacy, usability, conversion, or customer retention. 
Task 3: Create a Bug Report 
Build a clear, evidence-based bug report. 
Each defect should ideally include: 
• Unique defect ID 
• Defect title 
• Module or feature 
• Environment 
• Preconditions 
• Steps to reproduce 
• Expected result 
• Actual result 
• Severity 
• Priority 
• Business or user impact 
• Reproducibility 
• Supporting screenshot or video 
• Console, network, or system evidence where relevant 
• Suggested resolution, if appropriate 
Greater weight will be given to valid defects with significant business or customer impact. 
The number of bugs alone will not determine the winner. 
Duplicate, invalid, cosmetic-only, or poorly documented defects may receive limited or no 
credit. 
Task 4: Share Product Feedback 
Teams may also include Product feedback at the end of bug report: 
• User-experience observations 
• Product improvement ideas 
• Feature recommendations 
• Conversion improvements 
• Accessibility recommendations 
• Trust and safety improvements 
• Suggestions for simplifying the bargaining or buying experience 
Recommendations should be specific, evidence-based, and relevant to the product and its 
users.
© 2026 STeP-IN Forum. All Rights Reserved. 
General Rules 
• Only work completed or submitted before the challenge period will be evaluated. 
• All reported defects must be reproducible in the provided test environment. 
• Do not test Gajab production website or attempt to access another user’s information. 
• Do not perform denial-of-service testing, uncontrolled load testing, data extraction, 
privilege escalation, or intrusive security testing on Gajab production or test 
environment. 
• Use only authorized test accounts, mobile numbers, email addresses, and devices. 
• Do not expose OTPs, credentials, personal information, API keys, or secrets in 
repositories, screenshots, reports, or AI prompts. 
• Teams must comply with the application’s testing instructions and event code of 
conduct. 
• The judges’ decisions will be final. 
All the Best! 
© 2026 STeP-IN Forum. All Rights Reserved. 