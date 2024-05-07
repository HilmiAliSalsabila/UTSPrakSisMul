import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import Swal from 'sweetalert2';
import imageCompression from 'browser-image-compression';
import lamejs from 'lamejs';
import './App.css'; // Import file CSS yang berisi styling tambahan

const App = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedAudio, setSelectedAudio] = useState(null);
  const [processImage, setProcessImage] = useState(null);
  const [processAudio, setProcessAudio] = useState(null);
  const [maxWidth, setMaxWidth] = useState(300);
  const [maxHeight, setMaxHeight] = useState(300);

  const handleImageUpload = (file) => {
    setSelectedImage(file);
    setProcessAudio(null);
  };

  const handleAudioUpload = (file) => {
    setSelectedAudio(file);
    setSelectedImage(null);
  };

  const handleImageResize = async () => {
    if (selectedImage) {
      try {
        const options = {
          maxSizeMB: 50,
          maxWidth: maxWidth,
          maxHeight: maxHeight,
          useWebWorker: true,
        };
        console.log(options);
        const compressedImage = await imageCompression(selectedImage, options);
        setProcessImage(compressedImage);
      } catch (error) {
        console.log(error);
      }
    }
  };

  const compressAudio = (audioBuffer) => {
    const mp3Encoder = new lamejs.Mp3Encoder(1, audioBuffer.sampleRate, 32);
    const samples = audioBuffer.getChannelData(0);
    const sampleBlockSize = 1152;
    const mp3Data = [];

    for (let i = 0; i < samples.length; i += sampleBlockSize) {
      const sampleChunk = samples.subarray(i, i + sampleBlockSize);
      const mp3buf = mp3Encoder.encodeBuffer(sampleChunk);
      if (mp3buf.length > 0) {
        mp3Data.push(mp3buf);
      }
    }

    const mp3buf = mp3Encoder.flush();
    if (mp3buf.length > 0) {
      mp3Data.push(mp3buf);
    }

    const mergedMp3Data = new Uint8Array(mp3Data.reduce((acc, val) => acc + val.length, 0));
    let offset = 0;
    for (let i = 0; i < mp3Data.length; i++) {
      mergedMp3Data.set(mp3Data[i], offset);
      offset += mp3Data[i].length;
    }

    const blob = new Blob([mergedMp3Data], { type: 'audio/mp3' });
    return blob;
  };

  const handleAudioCompression = async () => {
    if (selectedAudio) {
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const reader = new FileReader();
        reader.onload = async (event) => {
          const arrayBuffer = event.target.result;
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          const compressedAudioBlob = compressAudio(audioBuffer);
          setProcessAudio(compressedAudioBlob);
        };
        reader.readAsArrayBuffer(selectedAudio);
      } catch (error) {
        console.log(error);
      }
    }
  };

  const handleDownloadImage = () => {
    const url = URL.createObjectURL(processImage);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'resized_image.jpg';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadAudio = () => {
    const url = URL.createObjectURL(processAudio);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'compressed_audio.mp3';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDrop = (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      if (file.type.startsWith('image')) {
        handleImageUpload(file);
      } else if (file.type.startsWith('audio')) {
        handleAudioUpload(file);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Unsupported File Type',
          text: 'Please drop an image or audio file.',
        });
      }
    } else {
      Swal.fire({
        icon: 'error',
        title: 'No File Dropped',
        text: 'Please drop a file to process.',
      });
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: handleDrop,
    accept: 'image/*,audio/*',
  });

  return (
    <div className="center">
      <h1>Image and Audio Processing</h1>
      <div className="box">
        <h3>Image Processing</h3>
        <div className="dropzone" {...getRootProps()} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '20px', padding: '20px', border: '2px dashed #007bff', borderRadius: '5px', cursor: 'pointer' }}>
          <input {...getInputProps()} />
          <p>Drag 'n' drop an image or audio file here, or click to select file</p>
        </div>
        {selectedImage && (
          <div>
            <img src={URL.createObjectURL(selectedImage)} width={200} alt="Selected Image" />
            <div>
              <label>Max Height:</label>
              <input type="number" value={maxHeight} onChange={(e) => setMaxHeight(parseInt(e.target.value))} />
              <div>
                <label>Max Width:</label>
                <input type="number" value={maxWidth} onChange={(e) => setMaxWidth(parseInt(e.target.value))} />
              </div>
            </div>
          </div>
        )}
        <button onClick={handleImageResize} disabled={!selectedImage}>
          Resize Image
        </button>
        {processImage && (
          <div>
            <h4>Processed Image</h4>
            <img src={URL.createObjectURL(processImage)} alt="Processed Image" />
            <button onClick={handleDownloadImage}>Download Image</button>
          </div>
        )}
      </div>
      <div className="box">
        <h3>Audio Processing</h3>
        <div className="dropzone" {...getRootProps()} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '20px', padding: '20px', border: '2px dashed #007bff', borderRadius: '5px', cursor: 'pointer' }}>
          <input {...getInputProps()} />
          <p>Drag 'n' drop an image or audio file here, or click to select file</p>
        </div>
        {selectedAudio && (
          <audio controls>
            <source src={URL.createObjectURL(selectedAudio)} type="audio/mp3" />
          </audio>
        )}
        <button onClick={handleAudioCompression} disabled={!selectedAudio}>
          Compress Audio
        </button>
        {processAudio && (
          <div>
            <h4>Processed Audio</h4>
            <audio controls>
              <source src={URL.createObjectURL(processAudio)} type="audio/mp3" />
            </audio>
            <button onClick={handleDownloadAudio}>Download Audio</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
