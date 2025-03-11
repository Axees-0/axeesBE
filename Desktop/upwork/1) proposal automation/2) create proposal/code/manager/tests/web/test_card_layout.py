#!/usr/bin/env python3
"""
Test suite for the Card-based Layout UI enhancement
- Verify cards display all required instance information
- Test card expansion/collapse functionality
- Ensure proper responsive behavior
- Test instance selection in card layout
- Verify batch operations work with card layout
"""

import os
import sys
import time
import unittest
import requests
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.common.exceptions import TimeoutException
from webdriver_manager.chrome import ChromeDriverManager

# Add the parent directory to the Python path
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from src.core.models.instance import RuntimeType


class CardLayoutTestCase(unittest.TestCase):
    """Test case for the Card-based Layout UI enhancement."""

    @classmethod
    def setUpClass(cls):
        """Set up the test environment."""
        # Find the parent directory (project root)
        cls.root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        
        # Use dashboard on port 7865
        print("Using dashboard on port 7865...")
        
        # No need to start dashboard since it's already running
        cls.server_thread = None
        
        # Set up the Selenium WebDriver
        chrome_options = Options()
        chrome_options.add_argument('--headless')  # Run headless by default
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        
        # Initialize Chrome driver with WebDriver Manager
        try:
            cls.driver = webdriver.Chrome(
                service=Service(ChromeDriverManager().install()),
                options=chrome_options
            )
            cls.driver.set_window_size(1366, 768)  # Set a reasonable window size
            cls.driver.implicitly_wait(10)
        except Exception as e:
            print(f"Failed to initialize WebDriver: {e}")
            cls.tearDownClass()
            raise
        
        # URL of the dashboard
        cls.base_url = "http://localhost:7865"
        
        # Ensure the dashboard is running
        try:
            response = requests.get(cls.base_url, timeout=10)
            if response.status_code != 200:
                raise Exception(f"Dashboard returned status code {response.status_code}")
            print("Dashboard is running")
        except requests.RequestException as e:
            cls.tearDownClass()
            raise Exception(f"Failed to connect to dashboard: {str(e)}")
        
        # Create test instances via API
        cls.create_test_instances()
        
    @classmethod
    def tearDownClass(cls):
        """Clean up after tests."""
        # Close the WebDriver
        if hasattr(cls, 'driver'):
            cls.driver.quit()
        
        # The server thread doesn't need explicit cleanup since it's a daemon thread
        print("Dashboard thread will terminate with the test process")

    @classmethod
    def create_test_instances(cls):
        """Create test instances with different statuses and runtime types."""
        # Use the API to create test instances
        for i in range(3):
            # Create a mix of tmux and terminal instances
            runtime_type = "tmux" if i % 2 == 0 else "terminal"
            
            # Create instance data
            data = {
                "project_dir": f"test_project_{i}",
                "prompt_text": f"Test prompt {i} for card layout testing",
                "runtime_type": runtime_type,
                "open_window": "off"
            }
            
            # Send POST request to create instance
            max_retries = 3
            for attempt in range(max_retries):
                try:
                    response = requests.post(f"{cls.base_url}/api/instances", data=data, timeout=10)
                    if response.status_code == 200:
                        print(f"Successfully created test instance {i}")
                        break
                    else:
                        print(f"Warning: Failed to create test instance {i} (attempt {attempt+1}), status: {response.status_code}")
                        time.sleep(2)  # Wait before retrying
                except Exception as e:
                    print(f"Error creating test instance (attempt {attempt+1}): {e}")
                    time.sleep(2)  # Wait before retrying
                
                if attempt == max_retries - 1:
                    print(f"Failed to create test instance {i} after {max_retries} attempts")
    
    def test_card_view_toggle(self):
        """Test switching between table and card view."""
        # Navigate to the dashboard
        self.driver.get(self.base_url)
        
        # Wait for the page to load
        WebDriverWait(self.driver, 10).until(
            EC.presence_of_element_located((By.ID, "instance-table"))
        )
        
        # Find and click the view toggle button
        try:
            view_toggle = WebDriverWait(self.driver, 5).until(
                EC.presence_of_element_located((By.ID, "view-toggle"))
            )
            view_toggle.click()
            
            # Check if card view is activated
            card_container = WebDriverWait(self.driver, 5).until(
                EC.presence_of_element_located((By.ID, "instance-cards"))
            )
            self.assertTrue(card_container.is_displayed(), "Card view not activated")
            
            # Check if the table view is hidden
            table = self.driver.find_element(By.ID, "instance-table")
            self.assertFalse(table.is_displayed(), "Table view still visible in card mode")
            
            # Toggle back to table view
            view_toggle.click()
            
            # Verify table view is active again
            table = WebDriverWait(self.driver, 5).until(
                EC.visibility_of_element_located((By.ID, "instance-table"))
            )
            self.assertTrue(table.is_displayed(), "Failed to toggle back to table view")
            
            # Card view should be hidden now
            card_container = self.driver.find_element(By.ID, "instance-cards")
            self.assertFalse(card_container.is_displayed(), "Card view still visible in table mode")
            
        except TimeoutException:
            self.fail("View toggle button not found or card view not implemented")
    
    def test_card_content(self):
        """Test that cards display all required instance information."""
        # Navigate to the dashboard
        self.driver.get(self.base_url)
        
        # Wait for the page to load
        WebDriverWait(self.driver, 10).until(
            EC.presence_of_element_located((By.ID, "instance-table"))
        )
        
        # Switch to card view
        try:
            # Find and click view toggle with retry mechanism
            max_retries = 3
            for attempt in range(max_retries):
                try:
                    view_toggle = WebDriverWait(self.driver, 5).until(
                        EC.element_to_be_clickable((By.ID, "view-toggle"))
                    )
                    view_toggle.click()
                    
                    # Wait for card view to appear
                    WebDriverWait(self.driver, 5).until(
                        EC.presence_of_element_located((By.ID, "instance-cards"))
                    )
                    break
                except Exception as e:
                    print(f"Toggle view attempt {attempt+1} failed: {e}")
                    if attempt == max_retries - 1:
                        raise
                    time.sleep(1)
            
            # Get cards after view has been toggled
            cards = WebDriverWait(self.driver, 5).until(
                EC.presence_of_all_elements_located((By.CLASS_NAME, "instance-card"))
            )
            
            # Verify we have at least one card
            self.assertGreater(len(cards), 0, "No instance cards found")
            
            # Use a fresh reference to first card to avoid stale reference
            first_card = WebDriverWait(self.driver, 5).until(
                EC.presence_of_element_located((By.CLASS_NAME, "instance-card"))
            )
            
            # Check for status badge
            status_badge = WebDriverWait(first_card, 5).until(
                EC.presence_of_element_located((By.CLASS_NAME, "status-badge"))
            )
            self.assertIsNotNone(status_badge, "Status badge not found in card")
            
            # Check for project directory
            project_info = WebDriverWait(first_card, 5).until(
                EC.presence_of_element_located((By.CLASS_NAME, "card-project"))
            )
            self.assertIsNotNone(project_info, "Project info not found in card")
            project_text = project_info.text
            self.assertIn("test_project_", project_text, f"Project info incorrect: '{project_text}'")
            
            # Check for prompt info
            prompt_info = WebDriverWait(first_card, 5).until(
                EC.presence_of_element_located((By.CLASS_NAME, "card-prompt"))
            )
            self.assertIsNotNone(prompt_info, "Prompt info not found in card")
            prompt_text = prompt_info.text
            self.assertIn("Test prompt", prompt_text, f"Prompt info incorrect: '{prompt_text}'")
            
        except TimeoutException as e:
            self.fail(f"Card view not implemented properly: {e}")
    
    def test_card_expansion(self):
        """Test card expansion functionality for viewing details."""
        # Navigate to the dashboard
        self.driver.get(self.base_url)
        
        # Wait for the page to load
        WebDriverWait(self.driver, 10).until(
            EC.presence_of_element_located((By.ID, "instance-table"))
        )
        
        # Switch to card view
        try:
            view_toggle = WebDriverWait(self.driver, 5).until(
                EC.presence_of_element_located((By.ID, "view-toggle"))
            )
            view_toggle.click()
            
            # Wait for cards to appear
            cards = WebDriverWait(self.driver, 5).until(
                EC.presence_of_all_elements_located((By.CLASS_NAME, "instance-card"))
            )
            
            if len(cards) > 0:
                # Click the first card to expand it
                expand_button = cards[0].find_element(By.CLASS_NAME, "card-expand")
                expand_button.click()
                
                # Check if card details are shown
                card_details = WebDriverWait(self.driver, 5).until(
                    EC.visibility_of_element_located((By.CLASS_NAME, "card-details"))
                )
                self.assertTrue(card_details.is_displayed(), "Card details not shown on expansion")
                
                # Check for more detailed information in expanded view
                # Like response content, buttons for actions, etc.
                action_buttons = card_details.find_elements(By.CLASS_NAME, "card-action")
                self.assertGreater(len(action_buttons), 0, "No action buttons in expanded card")
                
                # Click again to collapse
                expand_button.click()
                
                # Verify card is collapsed
                WebDriverWait(self.driver, 5).until(
                    EC.invisibility_of_element_located((By.CLASS_NAME, "card-details"))
                )
                
        except TimeoutException:
            self.fail("Card expansion functionality not implemented")
    
    def test_card_selection(self):
        """Test instance selection in card layout."""
        # Navigate to the dashboard
        self.driver.get(self.base_url)
        
        # Wait for the page to load and switch to card view
        WebDriverWait(self.driver, 10).until(
            EC.presence_of_element_located((By.ID, "instance-table"))
        )
        
        # Switch to card view
        try:
            view_toggle = self.driver.find_element(By.ID, "view-toggle")
            view_toggle.click()
            
            # Wait for cards to appear
            cards = WebDriverWait(self.driver, 5).until(
                EC.presence_of_all_elements_located((By.CLASS_NAME, "instance-card"))
            )
            
            if len(cards) > 1:
                # Click to select the first card
                select_checkbox = cards[0].find_element(By.CLASS_NAME, "card-select")
                select_checkbox.click()
                
                # Verify the card is selected
                self.assertTrue(
                    "selected" in cards[0].get_attribute("class"),
                    "Card not marked as selected"
                )
                
                # Select a second card with Ctrl key
                ActionChains(self.driver).key_down(Keys.CONTROL).click(
                    cards[1].find_element(By.CLASS_NAME, "card-select")
                ).key_up(Keys.CONTROL).perform()
                
                # Verify both cards are selected
                self.assertTrue(
                    "selected" in cards[1].get_attribute("class"),
                    "Second card not marked as selected"
                )
                
                # Verify the action buttons appear for multiple selection
                action_bar = WebDriverWait(self.driver, 5).until(
                    EC.visibility_of_element_located((By.CLASS_NAME, "action-buttons"))
                )
                self.assertTrue(action_bar.is_displayed(), "Action bar not shown for selected cards")
                
                # Check if the selection count is correct
                selection_count = action_bar.find_element(By.CLASS_NAME, "selected-count").text
                self.assertEqual(selection_count, "2", "Incorrect selection count displayed")
                
        except TimeoutException:
            self.fail("Card selection functionality not implemented")

    def test_responsive_layout(self):
        """Test responsive behavior of card layout."""
        # Navigate to the dashboard
        self.driver.get(self.base_url)
        
        # Wait for the page to load
        WebDriverWait(self.driver, 10).until(
            EC.presence_of_element_located((By.ID, "instance-table"))
        )
        
        # Switch to card view
        try:
            view_toggle = self.driver.find_element(By.ID, "view-toggle")
            view_toggle.click()
            
            # Test different viewport sizes
            viewport_sizes = [(1366, 768), (768, 1024), (375, 812)]  # Desktop, tablet, mobile
            
            for width, height in viewport_sizes:
                # Resize viewport
                self.driver.set_window_size(width, height)
                time.sleep(1)  # Allow layout to adjust
                
                # Check if cards are displayed properly
                cards = self.driver.find_elements(By.CLASS_NAME, "instance-card")
                self.assertGreater(len(cards), 0, f"No cards displayed at viewport size {width}x{height}")
                
                # For smaller viewports, check if the grid columns adjust
                if width <= 768:
                    # Should be a single column or max 2 columns on tablet
                    card_container = self.driver.find_element(By.ID, "instance-cards")
                    grid_template = self.driver.execute_script(
                        "return window.getComputedStyle(arguments[0]).getPropertyValue('grid-template-columns');",
                        card_container
                    )
                    
                    # Count the number of columns
                    column_count = len(grid_template.split())
                    self.assertLessEqual(column_count, 2 if width == 768 else 1, 
                                        f"Too many columns ({column_count}) at width {width}px")
                
        except TimeoutException:
            self.fail("Responsive layout not implemented properly")


if __name__ == "__main__":
    unittest.main()