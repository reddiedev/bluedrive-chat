import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
import time


@pytest.fixture(scope="function")
def driver():
    """Create a new Chrome driver instance for each test."""
    chrome_options = Options()
    # chrome_options.add_argument("--headless")
    chrome_options.add_argument("--window-size=1280,720")

    driver = webdriver.Chrome(options=chrome_options)
    driver.get("http://localhost:3000")
    yield driver
    driver.quit()


def is_chrome_window_open(driver):
    try:
        # Try to get window handles - if it fails, window is closed
        driver.window_handles
        return True
    except:  # noqa: E722
        return False


@pytest.mark.selenium
def test_continue_without_username(driver):
    """Test that submitting the form without a username shows the correct error message."""
    expected_message = "String must contain at least 1 character(s)"

    time.sleep(1)

    # Click the continue button
    button = driver.find_element("id", "continue-button")
    button.click()

    # Wait for the form message to appear (max 5 seconds)
    message_element = WebDriverWait(driver, 5).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, '[data-slot="form-message"]'))
    )

    # Assert the message matches the expected text
    assert message_element.text == expected_message, (
        f"Expected message '{expected_message}' but got '{message_element.text}'"
    )


@pytest.mark.selenium
def test_continue_with_username(driver):
    """Test that submitting the form with a username redirects to chat page."""
    test_username = "testuser123"

    time.sleep(1)  # Wait for page to load

    # Find and fill the username input
    username_input = driver.find_element("id", "username-input")
    username_input.send_keys(test_username)

    # Click the continue button
    button = driver.find_element("id", "continue-button")
    button.click()

    # Wait for URL to change and contain /chat
    WebDriverWait(driver, 5).until(lambda driver: "/chat" in driver.current_url)

    # Verify the URL contains the expected pattern
    assert "/chat" in driver.current_url, (
        f"Expected URL to contain '/chat' but got '{driver.current_url}'"
    )


@pytest.mark.selenium
def test_create_new_thread(driver):
    """Test that creating a new thread redirects to a new chat URL."""
    test_username = "testuser123"

    time.sleep(1)  # Wait for page to load

    # Find and fill the username input
    username_input = driver.find_element("id", "username-input")
    username_input.send_keys(test_username)

    # Click the continue button
    button = driver.find_element("id", "continue-button")
    button.click()

    # Wait for URL to change and contain /chat
    WebDriverWait(driver, 5).until(lambda driver: "/chat" in driver.current_url)

    # Get the initial chat URL
    initial_url = driver.current_url

    # Find and click the new thread button
    new_thread_button = WebDriverWait(driver, 5).until(
        EC.element_to_be_clickable((By.ID, "new-thread-button"))
    )
    new_thread_button.click()

    # Wait for URL to change to a new chat URL
    WebDriverWait(driver, 5).until(lambda driver: "/chat" in driver.current_url)

    # Verify the URL has changed to a new chat URL
    assert driver.current_url != initial_url, (
        "URL should change after creating new thread"
    )
    assert "/chat" in driver.current_url, (
        "URL should still contain /chat after creating new thread"
    )


try:
    # Keep the script running until window is closed or Ctrl+C
    while is_chrome_window_open(driver):
        time.sleep(1)  # Check every second

except KeyboardInterrupt:
    print("\nReceived keyboard interrupt, shutting down...")
