import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import * as tf from '@tensorflow/tfjs';
import * as facemesh from '@tensorflow-models/facemesh';
import * as emotion from '@tensorflow-models/facemesh';


@Component({
  selector: 'app-faces',
  standalone: true,
  templateUrl: './faces.component.html',
  styleUrls: ['./faces.component.css']
})
export class FacesComponent implements AfterViewInit, OnDestroy {
  @ViewChild('video') videoElement!: ElementRef<HTMLVideoElement>;

  private model: facemesh.FaceMesh | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private stream: MediaStream | null = null;

  constructor() { }

  ngAfterViewInit(): void {
    this.setupCamera();
  }

  ngOnDestroy(): void {
    this.stopStream();
  }

  async setupCamera() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({ video: true });
        this.videoElement.nativeElement.srcObject = this.stream;
        this.videoElement.nativeElement.play();
        await tf.setBackend('webgl');
        this.model = await facemesh.load();
        this.detectFaceInRealTime();
      } catch (err) {
        console.error('Error accessing camera:', err);
      }
    } else {
      console.error('Camera access not supported');
    }
  }

  async renderPrediction(predictions: any[], context: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    if (!this.videoElement.nativeElement || !this.model) {
      return;
    }

    const video = this.videoElement.nativeElement;

    context?.clearRect(0, 0, canvas.width, canvas.height);
    context?.drawImage(video, 0, 0, canvas.width, canvas.height);

    if (predictions.length > 0) {
      predictions.forEach((prediction: any) => {
        const keypoints = prediction.scaledMesh; // Assuming Coords3D type
        for (let i = 0; i < keypoints.length; i++) {
          const x = keypoints[i][0];
          const y = keypoints[i][1];

          context?.beginPath();
          context?.arc(x, y, 5, 0, 2 * Math.PI); // Increased dot size for better visibility
          context.fillStyle = 'red'; // Eliminar el operador opcional "?"
          context?.fill();
        }
      });
    }

    requestAnimationFrame(() => this.renderPrediction(predictions, context, canvas)); // Llamada recursiva
  }

  async detectFaceInRealTime() {
    if (!this.videoElement.nativeElement || !this.model) {
      return;
    }
  
    const video = this.videoElement.nativeElement;
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
  
    if (!context) {
      console.error('No se pudo obtener el contexto 2D del lienzo.');
      return;
    }
  
    this.canvas = canvas; // Almacenar referencia para posibles limpiezas
  
    video.parentElement?.appendChild(canvas);
  
    canvas.width = video.width;
    canvas.height = video.height;
  
    const renderPrediction = async () => {
      if (!this.videoElement.nativeElement || !this.model) {
        return;
      }
  
      const predictions = await this.model!.estimateFaces(video);
  
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
  
      if (predictions.length > 0) {
        predictions.forEach((prediction: any) => {
          const keypoints = prediction.scaledMesh; // Suponiendo tipo Coords3D
          for (let i = 0; i < keypoints.length; i++) {
            const x = keypoints[i][0];
            const y = keypoints[i][1];
  
            context.beginPath();
            context.arc(x, y, 1, 0, 2 * Math.PI); // Aumentar el tamaño del punto para mejorar la visibilidad
            context.fillStyle = '#00ff00';
            context.fill();
          }
        });
      }
  
      requestAnimationFrame(renderPrediction);
    };
  
    renderPrediction();
  }
  
  

  private stopStream() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
  }
}