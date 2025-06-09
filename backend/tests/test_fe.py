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
    expected_message = "Username cannot be empty"

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
def test_continue_with_long_username(driver):
    """Test that submitting the form with a long username shows the correct error message."""
    test_username = "testuser123" * 10
    expected_message = "Username is too long"

    time.sleep(1)  # Wait for page to load

    # Find and fill the username input
    username_input = driver.find_element("id", "username-input")
    username_input.send_keys(test_username)

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


@pytest.mark.selenium
def test_send_empty_message(driver):
    """Test that sending an empty message shows the correct error message."""
    test_username = "testuser123"
    expected_message = "Message cannot be empty"

    time.sleep(1)  # Wait for page to load

    # Find and fill the username input
    username_input = driver.find_element("id", "username-input")
    username_input.send_keys(test_username)

    # Click the continue button
    button = driver.find_element("id", "continue-button")
    button.click()

    # Wait for URL to change and contain /chat
    WebDriverWait(driver, 5).until(lambda driver: "/chat" in driver.current_url)

    # Find and click the send message button
    send_button = WebDriverWait(driver, 5).until(
        EC.element_to_be_clickable((By.ID, "send-message-button"))
    )
    send_button.click()

    # Wait for the form message to appear (max 5 seconds)
    message_element = WebDriverWait(driver, 5).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, '[data-slot="form-message"]'))
    )

    # Assert the message matches the expected text
    assert message_element.text == expected_message, (
        f"Expected message '{expected_message}' but got '{message_element.text}'"
    )


@pytest.mark.selenium
def test_send_message_and_verify_response(driver):
    """Test that sending a message shows the assistant's response."""
    test_username = "testuser123"
    test_message = "Hello"

    time.sleep(1)  # Wait for page to load

    # Find and fill the username input
    username_input = driver.find_element("id", "username-input")
    username_input.send_keys(test_username)

    # Click the continue button
    button = driver.find_element("id", "continue-button")
    button.click()

    # Wait for URL to change and contain /chat
    WebDriverWait(driver, 5).until(lambda driver: "/chat" in driver.current_url)

    # Find and fill the message input
    message_input = WebDriverWait(driver, 5).until(
        EC.presence_of_element_located((By.ID, "message-input"))
    )
    message_input.send_keys(test_message)

    # Find and click the send message button
    send_button = WebDriverWait(driver, 5).until(
        EC.element_to_be_clickable((By.ID, "send-message-button"))
    )
    send_button.click()

    # Wait for 5 seconds for the response
    time.sleep(5)

    # Wait for and verify the assistant's response
    assistant_response = WebDriverWait(driver, 5).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, '[data-slot="card"]'))
    )

    # Find the assistant label
    assistant_label = WebDriverWait(driver, 5).until(
        EC.presence_of_element_located(
            (By.XPATH, "//span[contains(@class, 'font-medium') and text()='Assistant']")
        )
    )

    # Verify that there is a non-empty response and the assistant label is present
    assert assistant_response.text.strip(), (
        "Expected a non-empty response from the assistant"
    )
    assert assistant_label.text == "Assistant", (
        "Expected to find 'Assistant' label in the response"
    )


try:
    # Keep the script running until window is closed or Ctrl+C
    while is_chrome_window_open(driver):
        time.sleep(1)  # Check every second

except KeyboardInterrupt:
    print("\nReceived keyboard interrupt, shutting down...")
