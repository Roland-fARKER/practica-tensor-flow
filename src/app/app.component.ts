import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import '@tensorflow/tfjs-backend-webgl';
import * as handpose from '@tensorflow-models/handpose';
import { FacesComponent } from './faces/faces.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, FacesComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'tensor';

  video : boolean = false;

  @ViewChild('video')
  videoElement!: ElementRef;
  @ViewChild('canvas')
  canvasElement!: ElementRef;

  async ngOnInit() {
    const model = await handpose.load();
    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;
    const ctx = canvas.getContext('2d');

    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        video.srcObject = stream;
        video.play();
      })
      .catch(err => {
        console.error('Error al acceder a la cámara:', err);
      });

    video.addEventListener('loadeddata', async () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const scaleFactor = 1; // Puedes ajustar este valor según sea necesario

      async function detectHands() {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const predictions = await model.estimateHands(video, false);
        if (predictions.length > 0) {
          predictions.forEach(prediction => {
            const landmarks = prediction.landmarks;

            ctx.beginPath();
            ctx.lineWidth = 2;
            ctx.strokeStyle = 'red';

            for (let i = 0; i < landmarks.length - 1; i++) {
              const landmark1 = landmarks[i];
              const landmark2 = landmarks[i + 1];
              ctx.moveTo(landmark1[0] * scaleFactor, landmark1[1] * scaleFactor);
              ctx.lineTo(landmark2[0] * scaleFactor, landmark2[1] * scaleFactor);
            }

            ctx.closePath();
            ctx.stroke();

            // Dibuja los puntos de los landmarks
            prediction.landmarks.forEach(landmark => {
              ctx.beginPath();
              ctx.arc(landmark[0] * scaleFactor, landmark[1] * scaleFactor, 5, 0, 2 * Math.PI);
              ctx.fillStyle = 'blue';
              ctx.fill();
            });
          });
        }
        requestAnimationFrame(detectHands);
      }

      detectHands();
    });
  }
}