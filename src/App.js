import "./style.css";
import { useState, useEffect, useRef } from "react";
import { CirclePicker } from "react-color";
import html2canvas from "html2canvas";
// import env
const KEY = process.env.REACT_APP_KEY;

function App() {
  const [query, setQuery] = useState("");
  const [memes, setMemes] = useState([]);
  const [memeSearchLoading, setMemeSearchLoading] = useState(false);
  const [selectedMeme, setSelectedMeme] = useState(null);
  const [editorBox, setEditorBox] = useState("meme");
  const [resultOffset, setResultOffset] = useState(0);
  const [textInfo, setTextInfo] = useState({
    text: "",
    textSize: 94,
    textColor: "#ffffff",
    textFamily: "Arial",
    textTop: "50%",
    textLeft: "50%",
    textWeight: "normal",
  });

  useEffect(() => {
    async function fetchMemes() {
      setMemeSearchLoading(true);
      setMemes([]);
      const memeResponse = await fetch(
        `https://api.giphy.com/v1/gifs/search?api_key=${KEY}&q=${query}&limit=6&offset=${resultOffset}&rating=g&lang=en&bundle=messaging_non_clips`
      );
      const memeData = await memeResponse.json();
      if (memeData.meta.status !== 200) {
        setMemeSearchLoading(false);
        return;
      }
      setMemes(memeData.data || []);
      setMemeSearchLoading(false);
    }
    if (query.length < 3) return;
    fetchMemes();
  }, [query]);

  function handleOnChange(query) {
    setQuery(query);
  }

  function handleSelectMeme(meme) {
    return () => setSelectedMeme(meme);
  }

  function handleEditorBoxChange(editorBox) {
    return () => setEditorBox(editorBox);
  }

  function handleOffset(offset) {
    setResultOffset(offset);
  }

  function reset() {
    setQuery("");
    setMemes([]);
    setSelectedMeme(null);
    setResultOffset(0);
    setTextInfo({
      text: "",
      textSize: 94,
      textColor: "#ffffff",
      textFamily: "Arial",
      textTop: "50%",
      textLeft: "50%",
      textWeight: "normal",
    });
  }

  return (
    <div>
      <Input onChange={handleOnChange} />
      <div>
        <ResultContainer
          selectedMeme={selectedMeme}
          textInfo={textInfo}
          reset={reset}
        />
        <div className="editor_group">
          <EditorSelector onEditorBoxChange={handleEditorBoxChange} />
          <div className="editor_container">
            {editorBox === "meme" ? (
              <MemeSearchList
                memeSearchLoading={memeSearchLoading}
                memes={memes}
                onSelectMeme={handleSelectMeme}
                onChangeOffset={setResultOffset}
              />
            ) : (
              <TextEditor onChangeText={setTextInfo} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

function Input({ onChange }) {
  return (
    <div className="input_container">
      <input type="text" onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function ResultContainer({ selectedMeme, textInfo, reset }) {
  const { text, textSize, textColor, textTop, textLeft, textWeight } = textInfo;

  const componentRef = useRef(null);

  const loadImage = (src) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous"; // 啟用 CORS
      img.src = src;
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
    });
  };

  const downloadImage = async () => {
    const element = componentRef.current;

    if (element) {
      const images = element.getElementsByTagName("img");
      const loadPromises = [];
      for (let img of images) {
        loadPromises.push(loadImage(img.src));
      }

      try {
        await Promise.all(loadPromises);
      } catch (error) {
        console.error("Error loading images:", error);
      }
    }

    const canvas = await html2canvas(element, { useCORS: true });
    const imgData = canvas.toDataURL("image/webp");

    const link = document.createElement("a");
    link.href = imgData;
    link.download = "component.webp";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  return (
    <div className="result_container">
      <div className="result" ref={componentRef}>
        {selectedMeme ? (
          <img
            src={selectedMeme.images.original.webp}
            alt={selectedMeme.title}
            style={{ display: "block", maxWidth: "100%" }}
          />
        ) : (
          <span className="title">Search Memes</span>
        )}

        <MemeText
          text={text}
          textSize={textSize}
          textTop={textTop}
          textLeft={textLeft}
          textColor={textColor}
          textWeight={textWeight}
        />
      </div>
      <div className="button_group">
        <Button text="Reset" onClick={reset} />
        <Button text="Download" onClick={downloadImage} />
      </div>
    </div>
  );
}

function MemeSearchList({ memeSearchLoading, memes, onSelectMeme }) {
  return (
    <div className="meme_result_container">
      {memeSearchLoading ? (
        <Loading />
      ) : (
        memes.map((meme) => (
          <MemeResultItem
            key={meme.id}
            meme={meme}
            onSelectMeme={onSelectMeme}
          />
        ))
      )}
    </div>
  );
}

function MemeResultItem({ meme, onSelectMeme }) {
  console.log(meme);
  return (
    <div className="meme_item" onClick={onSelectMeme(meme)}>
      <img src={meme.images.original.webp} alt="meme_images" />
    </div>
  );
}

function Loading() {
  return <div className="loading">Loading...</div>;
}

function Button({ text, onClick }) {
  return (
    <button className="button" onClick={onClick}>
      {text}
    </button>
  );
}

function MemeText({
  text = "",
  textColor = "#ffffff",
  textSize = 94,
  textFamily = "Arial",
  textTop = "10%",
  textLeft = 0,
  textWeight = 400,
}) {
  return (
    <div
      className="meme_text"
      style={{
        color: textColor,
        fontSize: textSize,
        fontFamily: textFamily,
        top: textTop,
        left: textLeft,
        fontWeight: textWeight,
      }}
    >
      {text}
    </div>
  );
}

function EditorSelector({ onEditorBoxChange }) {
  return (
    <div className="select_btn_container">
      <button onClick={onEditorBoxChange("meme")}>
        Meme<span></span>
        <span></span>
        <span></span>
        <span></span>
      </button>
      <button onClick={onEditorBoxChange("text")}>
        Text<span></span>
        <span></span>
        <span></span>
        <span></span>
      </button>
    </div>
  );
}

function TextEditor({ onChangeText }) {
  function handleTextChange(e) {
    onChangeText((prev) => ({ ...prev, text: e.target.value }));
  }
  function handleTextSizeChange(e) {
    const textSize = `${e.target.value}px`;
    onChangeText((prev) => ({ ...prev, textSize: textSize }));
  }
  function handleTextColorChange(color, e) {
    onChangeText((prev) => ({ ...prev, textColor: color.hex }));
    // onChangeText(color.hex);
  }
  function handleTextTopChange(e) {
    const top = `${e.target.value}%`;
    onChangeText((prev) => ({ ...prev, textTop: top }));
  }
  function handleTextLeftChange(e) {
    const left = `${e.target.value}%`;
    onChangeText((prev) => ({ ...prev, textLeft: left }));
  }
  return (
    <div className="text_editor">
      <div className="edit_box">
        <span>Text</span>
        <input type="text" onChange={handleTextChange} />
      </div>
      <div className="edit_box">
        <span>Font Size</span>
        <input type="text" onChange={handleTextSizeChange} />
      </div>
      <div className="edit_box">
        <span>Text Color</span>
        <CirclePicker
          triangle="top-right"
          onChangeComplete={handleTextColorChange}
          colors={[
            "#f44336",
            "#e91e63",
            "#9c27b0",
            "#673ab7",
            "#3f51b5",
            "#2196f3",
            "#03a9f4",
            "#00bcd4",
            "#009688",
            "#4caf50",
            "#8bc34a",
            "#cddc39",
            "#ffeb3b",
            "#ffc107",
            "#ff9800",
            "#ff5722",
            "#ffff",
            "#000",
          ]}
        />
      </div>
      <div className="edit_box">
        <span>Top Offset</span>
        <input type="range" onChange={handleTextTopChange} min={0} max={100} />
      </div>
      <div className="edit_box">
        <span>Left Offset</span>
        <input type="range" onChange={handleTextLeftChange} min={0} max={100} />
      </div>
    </div>
  );
}
