$(document).ready(function () {
  const API_KEY = "AIzaSyC_JJsQJWh-zT5WkK99gvqFVJHCL8r8HZs"; // Your API key here
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
  let userMessage = null;
  let isResponseGenerating = false;

  // Load theme and chat data from local storage on page load
  const loadDataFromLocalStorage = () => {
    const savedChats = localStorage.getItem("saved-chats");
    const isLightMode = localStorage.getItem("themeColor") === "light_mode";

    $("body").toggleClass("light_mode", isLightMode);
    $("#theme-toggle-button").text(isLightMode ? "dark_mode" : "light_mode");

    $(".chat-list").html(savedChats || "");
    $("body").toggleClass("hide-header", !!savedChats);
    $(".chat-list").scrollTop($(".chat-list")[0].scrollHeight);
  };

  // Create a new message element and return it
  const createMessageElement = (content, classes) => {
    const $div = $("<div>").addClass("message").addClass(classes).html(content);
    return $div;
  };

  // Show typing effect by displaying words one by one
  const showTypingEffect = (text, $textElement, $incomingMessageDiv) => {
    const words = text.split(" ");
    let currentWordIndex = 0;

    const typingInterval = setInterval(() => {
      $textElement.text(
        $textElement.text() +
          (currentWordIndex === 0 ? "" : " ") +
          words[currentWordIndex++]
      );

      $incomingMessageDiv
        .find(".icon")
        .toggleClass("hide", currentWordIndex !== words.length);

      if (currentWordIndex === words.length) {
        clearInterval(typingInterval);
        isResponseGenerating = false;
        localStorage.setItem("saved-chats", $(".chat-list").html());
      }
      $(".chat-list").scrollTop($(".chat-list")[0].scrollHeight);
    }, 75);
  };

  // Fetch response from the API based on user message
  const generateAPIResponse = async ($incomingMessageDiv) => {
    const $textElement = $incomingMessageDiv.find(".text");

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: userMessage }],
            },
          ],
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error.message);

      const apiResponse = data.candidates[0].content.parts[0].text.replace(
        /\*\*(.*?)\*\*/g,
        "$1"
      );
      showTypingEffect(apiResponse, $textElement, $incomingMessageDiv);
    } catch (error) {
      isResponseGenerating = false;
      $textElement.text(error.message);
      $incomingMessageDiv.addClass("error");
    } finally {
      $incomingMessageDiv.removeClass("loading");
    }
  };

  // Show a loading animation while waiting for the API response
  const showLoadingAnimation = () => {
    const html = `<div class="message-content">
                      <img class="avatar" src="ai-technology.png" alt="Gemini avatar">
                      <p class="text"></p>
                      <div class="loading-indicator">
                        <div class="loading-bar"></div>
                        <div class="loading-bar"></div>
                        <div class="loading-bar"></div>
                      </div>
                    </div>
                    <span onClick="copyMessage(this)" class="icon material-symbols-rounded">content_copy</span>`;

    const $incomingMessageDiv = createMessageElement(html, "incoming loading");
    $(".chat-list").append($incomingMessageDiv);
    $(".chat-list").scrollTop($(".chat-list")[0].scrollHeight);
    generateAPIResponse($incomingMessageDiv);
  };

  // Copy message text to the clipboard
  const copyMessage = ($copyButton) => {
    const messageText = $copyButton.closest(".message").find(".text").text();
    navigator.clipboard.writeText(messageText);
    $copyButton.text("done");

    setTimeout(() => $copyButton.text("content_copy"), 1000);
  };

  // Handle sending outgoing chat messages
  const handleOutgoingChat = () => {
    userMessage = $(".typing-input").val().trim() || userMessage;
    if (!userMessage || isResponseGenerating) return;

    isResponseGenerating = true;

    const html = `<div class="message-content">
                      <img class="avatar" src="user.png" alt="User avatar">
                      <p class="text"></p>
                    </div>`;

    const $outgoingMessageDiv = createMessageElement(html, "outgoing");
    // console.log(userMessage);
    $outgoingMessageDiv.find(".text").text(userMessage);
    $(".chat-list").append($outgoingMessageDiv);

    $(".typing-form")[0].reset();
    $("body").addClass("hide-header");
    $(".chat-list").scrollTop($(".chat-list")[0].scrollHeight);

    setTimeout(showLoadingAnimation, 500);
  };

  // Event listeners
  $("#theme-toggle-button").on("click", () => {
    const isLightMode = $("body")
      .toggleClass("light_mode")
      .hasClass("light_mode");
    localStorage.setItem(
      "themeColor",
      isLightMode ? "light_mode" : "dark_mode"
    );
    $("#theme-toggle-button").text(isLightMode ? "dark_mode" : "light_mode");
  });

  $("#delete-chat-button").on("click", () => {
    swal.fire({
        icon:'question',
        title:'Are you sure?',
        text:'Do you wish to delete all chats?',
        allowOutsideClick:false,
        showCancelButton:true,
    }).then((result)=>{
        if(result.isConfirmed){
            localStorage.removeItem("saved-chats");
            loadDataFromLocalStorage();
        }
        swal.fire({
            icon:'success',
            text:'Chats are deleted successfully.',
            allowOutsideClick:false,
        })
    })
  });

  $(".suggestion").on("click", function () {
    userMessage = $(this).find(".text").text();
    handleOutgoingChat();
  });

  $(".typing-form").on("submit", (e) => {
    e.preventDefault();
    handleOutgoingChat();
  });

  loadDataFromLocalStorage();
});
