const baseUrl = "https://tarmeezacademy.com/api/v1";

setupUi();

getPosts();
function getPosts(reload = true, page) {
	axios.get(`${baseUrl}/posts?limit=5&page=${page}`).then((response) => {
		let posts = response.data.data;

		lastPage = response.data.meta.last_page;
		if (reload) {
			document.getElementById("posts").innerHTML = "";
		}

		for (post of posts) {
			const author = post.author;

			let postTitle = "";

			let user = getCurrentUser();
			let isMyPost = user != null && post.author.id == user.id;
			let editBtnContent = ``;
			if (isMyPost) {
				editBtnContent = `
				<button class="btn btn-secondary" style="float: right" onclick="editPostBtnClicked('${encodeURIComponent(
					JSON.stringify(post)
				)}')">edit</button>
				`;
			}

			if (post.title != null) {
				postTitle = post.title;
			}

			let commentsNumber = post.comments_count > 1 ? "comments" : "comment";

			let content = `
					<div class="card shadow my-3">
            <div class="card-header">
              <img class="rounded-circle" style="width: 40px; height: 40px;" loading="lazy"
                src="${post.author.profile_image}" alt="">
              <b>${author.name}</b>
							${editBtnContent}
            </div>
            <div class="card-body" onclick="postClicked(${post.id})">
              <img class="w-100 contentImage"
                src="${post.image}"
                alt="" loading="lazy">
              <h5>${postTitle}</h5>
              <p>${post.body}</p>
              <hr />
              <div>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pen"
                  viewBox="0 0 16 16">
                  <path
                    d="m13.498.795.149-.149a1.207 1.207 0 1 1 1.707 1.708l-.149.148a1.5 1.5 0 0 1-.059 2.059L4.854 14.854a.5.5 0 0 1-.233.131l-4 1a.5.5 0 0 1-.606-.606l1-4a.5.5 0 0 1 .131-.232l9.642-9.642a.5.5 0 0 0-.642.056L6.854 4.854a.5.5 0 1 1-.708-.708L9.44.854A1.5 1.5 0 0 1 11.5.796a1.5 1.5 0 0 1 1.998-.001zm-.644.766a.5.5 0 0 0-.707 0L1.95 11.756l-.764 3.057 3.057-.764L14.44 3.854a.5.5 0 0 0 0-.708l-1.585-1.585z" />
                </svg>
                <span>${post.comments_count} ${commentsNumber}
								</span>
              </div>
              <h6 class="mt-2">${post.created_at}</h6>
            </div>
          </div>`;
			document.getElementById("posts").innerHTML += content;
		}
	});
	// .catch((error) => {
	// 	console.log(error);
	// });
}

function registerBtnClicked() {
	const name = document.getElementById("registerNameInput").value;
	const username = document.getElementById("registerUsernameInput").value;
	const password = document.getElementById("registerPasswordInput").value;
	const image = document.getElementById("registerImageInput").files[0];

	let formData = new FormData();
	formData.append("name", name);
	formData.append("username", username);
	formData.append("password", password);
	formData.append("image", image);

	const headers = {
		"Content-Type": "multipart/form-data",
	};

	const url = `${baseUrl}/register`;

	axios
		.post(url, formData, {
			headers: headers,
		})
		.then((response) => {
			console.log(response.data);
			localStorage.setItem("token", response.data.token);
			localStorage.setItem("user", JSON.stringify(response.data.user));

			// hide login modal in bootstrap
			const modal = document.getElementById("registerModal");
			const modalInstance = bootstrap.Modal.getInstance(modal);
			modalInstance.hide();
			showAlert("New User Registered Successfully!", "success");

			setupUi();
		})
		.catch((error) => {
			const message = error.response.data.message;
			showAlert(message, "danger");
		});
}

function loginBtnClicked() {
	const username = document.getElementById("usernameInput").value;
	const password = document.getElementById("passwordInput").value;

	const params = {
		username: username,
		password: password,
	};

	const url = `${baseUrl}/login`;

	axios.post(url, params).then((response) => {
		localStorage.setItem("token", response.data.token);
		localStorage.setItem("user", JSON.stringify(response.data.user));

		// hide login modal in bootstrap
		const modal = document.getElementById("loginModal");
		const modalInstance = bootstrap.Modal.getInstance(modal);
		modalInstance.hide();

		showAlert(`Welcome ${username}, You're Logged In!`);

		setupUi();
	});
}

function showAlert(customMessage, type = "success") {
	const alertPlaceholder = document.getElementById("showAlert");
	const alert = (message, type) => {
		const wrapper = document.createElement("div");
		wrapper.innerHTML = [
			`<div class="alert alert-${type} alert-dismissible" role="alert">`,
			`   <div>${message}</div>`,
			'   <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>',
			"</div>",
		].join("");

		alertPlaceholder.append(wrapper);
	};

	alert(customMessage, type);

	// todo: hide success login alert
	// setTimeout(() => {
	// const hideAlert = bootstrap.Alert.getOrCreateInstance("#showAlert");
	// hideAlert.close();
	// }, 3000);
}

function logout() {
	const username = document.getElementById("usernameInput").value;

	localStorage.removeItem("token");
	localStorage.removeItem("user");
	showAlert(`Bye ${username}, You're Logged Out!`);
	setupUi();

	// setTimeout(() => {
	// const hideAlert = bootstrap.Alert.getOrCreateInstance("#showAlert");
	// hideAlert.close();

	// const modal = document.getElementById("showAlert");
	// const modalAlert = bootstrap.Modal.getInstance(modal);
	// modalAlert.hide();
	// }, 3000);
}

function createNewPostClicked() {
	let postId = document.getElementById("postIdInput").value;
	let isCreate = postId == null || postId == "";

	const title = document.getElementById("postTitleInput").value;
	const body = document.getElementById("postBodyInput").value;
	const image = document.getElementById("postImageInput").files[0];
	const token = localStorage.getItem("token");

	let formData = new FormData();
	formData.append("title", title);
	formData.append("body", body);
	formData.append("image", image);

	let url = ``;

	if (isCreate) {
		url = `${baseUrl}/posts`;
		scrollToTop();
		showAlert("New Post Has Been Added Successfully");
	} else {
		formData.append("_method", "put");
		url = `${baseUrl}/posts/${postId}`;
		showAlert("Post Has Been Edited Successfully");
	}

	axios
		.post(url, formData, {
			headers: {
				authorization: `Bearer ${token}`,
			},
		})
		.then(() => {
			const modal = document.getElementById("createPostModal");
			const modalInstance = bootstrap.Modal.getInstance(modal);
			modalInstance.hide();

			setupUi();
			getPosts();
		})
		.catch((error) => {
			const message = error.response.data.message;
			showAlert(message, "danger");
		});
}

function setupUi() {
	const token = localStorage.getItem("token");
	const registerBtn = document.getElementById("registerBtn");
	const loginBtn = document.getElementById("loginBtn");
	const logoutDiv = document.getElementById("logoutDiv");
	const addBtn = document.getElementById("addPostIcon");
	const username = document.getElementById("navUsername");
	const userImage = document.getElementById("navUserImage");

	if (token == null) {
		if (addBtn != null) {
			addBtn.style.setProperty("display", "none");
		}
		loginBtn.style.setProperty("display", "flex");
		registerBtn.style.setProperty("display", "flex");
		logoutDiv.style.setProperty("display", "none");
	} else {
		if (addBtn != null) {
			addBtn.style.setProperty("display", "block");
		}
		loginBtn.style.setProperty("display", "none");
		registerBtn.style.setProperty("display", "none");
		logoutDiv.style.setProperty("display", "contents");
		const user = getCurrentUser();
		username.innerHTML = user.name;
		userImage.src = user.profile_image;
	}
}
setupUi();

function getCurrentUser() {
	let user = null;
	const storageUser = localStorage.getItem("user");

	if (storageUser != null) {
		user = JSON.parse(storageUser);
	}

	return user;
}

function postClicked(postId) {
	location = `
	postDetails.html?postId=${postId}
	`;
	// alert(postId);
}

const urlParams = new URLSearchParams(window.location.search);
const id = urlParams.get("postId");

function getPost() {
	axios.get(`${baseUrl}/posts/${id}`).then((response) => {
		const post = response.data.data;
		const comments = post.comments;
		const author = post.author;

		let commentsCount = post.comments_count > 1 ? "comments" : "comment";

		document.getElementById("usernameSpan").innerHTML = author.name;

		let postTitle = "";
		if (post.title != null) {
			postTitle = post.title;
		}

		let commentsContent = "";
		for (userComment of comments) {
			commentsContent += `
			<div class="p-3 m-2 comment">
            <div>
              <img src="${userComment.author.profile_image}" class="rounded-circle" alt="" style="width: 40px; height: 40px">
              <b>${userComment.author.name}</b>
							
            </div>

            <!-- Comment's Body -->
            <div style="padding-left: 44px">
              ${userComment.body}
            </div>
          </div>
			`;
		}

		const postContent = `
		<div class="card shadow my-3">
      <div class="card-header">
        <img class="rounded-circle" style="width: 40px; height: 40px;" loading="lazy" src="${author.profile_image}" alt="">
        <b>@${author.name}</b>
      </div>
      <div class="card-body">
        <img class="w-100 contentImage" src="${post.image}" alt="" loading="lazy">
        <h5>${postTitle}</h5>
        <p>${post.body}</p>
        <hr />
        <div>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pen"
            viewBox="0 0 16 16">
            <path
              d="m13.498.795.149-.149a1.207 1.207 0 1 1 1.707 1.708l-.149.148a1.5 1.5 0 0 1-.059 2.059L4.854 14.854a.5.5 0 0 1-.233.131l-4 1a.5.5 0 0 1-.606-.606l1-4a.5.5 0 0 1 .131-.232l9.642-9.642a.5.5 0 0 0-.642.056L6.854 4.854a.5.5 0 1 1-.708-.708L9.44.854A1.5 1.5 0 0 1 11.5.796a1.5 1.5 0 0 1 1.998-.001zm-.644.766a.5.5 0 0 0-.707 0L1.95 11.756l-.764 3.057 3.057-.764L14.44 3.854a.5.5 0 0 0 0-.708l-1.585-1.585z" />
          </svg>
          <span>${post.comments_count} ${commentsCount}
          </span>
        </div>
        <h6 class="mt-2">${post.created_at}</h6>
      </div>

			<div id="comments">
			${commentsContent}
			</div>
			<!-- Send Comment -->
            <div class="input-group" id="addComment">
              <input id="commentInput" type="text" placeholder="write your comment" class="form-control">
              <button class="btn btn-outline-primary" onclick="createCommentClicked()">Send</button>
            </div>

    </div>
		`;
		document.getElementById("post").innerHTML = postContent;
	});
}

getPost();

function createCommentClicked() {
	let commentBody = document.getElementById("commentInput").value;
	let params = {
		body: commentBody,
	};
	let token = localStorage.getItem("token");
	let url = `${baseUrl}/posts/${id}/comments`;
	axios
		.post(url, params, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		})
		.then((response) => {
			showAlert("Your Comment Has Been Created Successfully");
			getPost();
		})
		.catch((error) => {
			const errorMsg = error.response.data.message;
			showAlert(errorMsg, "danger");
		});
}

function editPostBtnClicked(postObject) {
	let post = JSON.parse(decodeURIComponent(postObject));
	console.log(post);

	document.getElementById("postModalTitle").innerHTML = "Edit Post";
	document.getElementById("postIdInput").value = post.id;
	document.getElementById("postTitleInput").value = post.title;
	document.getElementById("postBodyInput").value = post.body;
	// document.getElementById("postImageInput").files[0] = post.image;

	document.getElementById("postModalSubmitBtn").innerHTML = "Update";
	let postModal = new bootstrap.Modal(
		document.getElementById("createPostModal"),
		{}
	);
	postModal.toggle();
}

function addPostIconClicked() {
	document.getElementById("postModalSubmitBtn").innerHTML = "Create";
	document.getElementById("postIdInput").value = "";
	document.getElementById("postModalTitle").innerHTML = "Create New Post";
	document.getElementById("postTitleInput").value = "";
	document.getElementById("postBodyInput").value = "";
	let postModal = new bootstrap.Modal(
		document.getElementById("createPostModal"),
		{}
	);
	postModal.toggle();
}
