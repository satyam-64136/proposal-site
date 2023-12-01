function getRandomPosition() {
    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;

    const buttonHeight = document.getElementById('NO').offsetHeight;
    const buttonWidth = document.getElementById('NO').offsetWidth;

    const randomY = Math.floor(Math.random() * (windowHeight - buttonHeight));
    const randomX = Math.floor(Math.random() * (windowWidth - buttonWidth));

    return { top: randomY, left: randomX };
}

function moveButton() {
    const noButton = document.getElementById('NO');
    const randomPosition = getRandomPosition();

    noButton.style.position = 'absolute';
    noButton.style.top = `${randomPosition.top}px`;
    noButton.style.left = `${randomPosition.left}px`;
}

setInterval(moveButton, 800);

function changeContent() {
    document.getElementById('mainHeading').innerText = "YAY, see you soon...ɷ◡ɷ";
    document.getElementById('catGif').src = "images/goma-goma-cat.gif";
    var sound = document.getElementById('yessoundEffect');
    sound.play();
}

function playSoundEffect() {
    var sound = document.getElementById('soundEffect');
    sound.play();
}



function noButtonClick() {
    var noButtonClickSound = document.getElementById('noButtonClickSound');
    noButtonClickSound.play();

    document.getElementById('mainHeading').innerText = "STFU....(ᗒᗣᗕ)՞";
    document.getElementById('catGif').src = "images/angry-cat.gif";

    setTimeout(function () {
        document.getElementById('mainHeading').innerText = "Will, you go on a date with me?";
        document.getElementById('catGif').src = "images/peach-goma-love-heart-dance.gif";
    }, 1500);
}
