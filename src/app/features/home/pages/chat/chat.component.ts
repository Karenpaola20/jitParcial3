import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { Firestore, collection, collectionData, doc, setDoc, getDoc, addDoc, query, orderBy } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { UserEntity } from 'src/app/core/domain/entities/user.entity';
import { supabase } from '../../services/supabase';
import { VoiceRecorder } from 'capacitor-voice-recorder';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Subscription } from 'rxjs';

@Component({
  standalone: false,
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
})
export class ChatComponent implements OnInit, OnDestroy {
  senderId!: string;
  receiverId!: string;
  chatId: string = '';
  messages: any[] = [];
  textToSend: string = '';
  subscription?: Subscription;

  constructor(
    private firestore: Firestore,
    private auth: Auth,
    private route: ActivatedRoute,
    private location: Location
  ) {}

  async ngOnInit() {
    this.senderId = this.auth.currentUser?.uid || '';
    this.receiverId = this.route.snapshot.paramMap.get('id') || '';
    console.log('SenderID:', this.senderId, 'ReceiverID:', this.receiverId);

    if (!this.senderId || !this.receiverId) {
      console.error('IDs inválidos');
      return;
    }

    console.log('Chat ID generado:', this.chatId);
    this.chatId = this.generateChatId(this.senderId, this.receiverId);
    const messagesRef = collection(this.firestore, `chats/${this.chatId}/messages`);
    const q = query(messagesRef, orderBy('timestamp'));

    this.subscription = collectionData(q, { idField: 'id' }).subscribe(data => {
      this.messages = data;
    });
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

  generateChatId(userA: string, userB: string): string {
    return [userA, userB].sort().join('_');
  }

  async sendMessage(content: string = this.textToSend, type: 'text' | 'image' | 'audio' | 'location' = 'text') {
    if (!content.trim()) return;

    const chatDocRef = doc(this.firestore, `chats/${this.chatId}`);
    const chatSnap = await getDoc(chatDocRef);

    const usersRef = collection(this.firestore, 'users');

    const preview =
      type === 'text' ? content :
      type === 'image' ? '[Imagen]' :
      type === 'audio' ? '[Audio]' :
      '[Ubicación]';

    if (!chatSnap.exists()) {
      const senderSnap = await getDoc(doc(usersRef, this.senderId));
      const receiverSnap = await getDoc(doc(usersRef, this.receiverId));

      const sender = senderSnap.data();
      const receiver = receiverSnap.data();

      await setDoc(chatDocRef, {
        chatId: this.chatId,
        participants: [this.senderId, this.receiverId],
        createdAt: new Date(),
        lastMessage: preview,
        senderId: this.senderId,
        receiverId: this.receiverId,
        senderFirstName: sender?.['firstName'] || '',
        senderSurname: sender?.['surname'] || '',
        receiverFirstName: receiver?.['firstName'] || '',
        receiverSurname: receiver?.['surname'] || ''
      });
    } else {
      await setDoc(chatDocRef, {
        lastMessage: preview,
        updatedAt: new Date(),
        senderId: this.senderId
      }, { merge: true });
    }

    const messagesRef = collection(this.firestore, `chats/${this.chatId}/messages`);
    await addDoc(messagesRef, {
      senderId: this.senderId,
      type,
      content,
      timestamp: new Date()
    });

    if (type === 'text') this.textToSend = '';
  }

  async selectAndSendImage() {
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Prompt
      });

      if (!image?.webPath) return;

      const response = await fetch(image.webPath);
      const blob = await response.blob();
      const fileName = `chat_${this.chatId}_${Date.now()}.jpg`;

      const { error } = await supabase.storage.from('images').upload(fileName, blob, {
        contentType: blob.type,
        upsert: true
      });

      if (error) {
        console.error('Error al subir imagen:', error);
        return;
      }

      const { data } = supabase.storage.from('images').getPublicUrl(fileName);
      await this.sendMessage(data.publicUrl, 'image');

    } catch (err) {
      console.error('Error al seleccionar imagen:', err);
    }
  }

  async startRecording() {
    const permission = await VoiceRecorder.requestAudioRecordingPermission();
    if (!permission.value) {
      console.error('Permiso de audio denegado');
      return;
    }
    await VoiceRecorder.startRecording();
  }

  async stopRecording() {
    const result = await VoiceRecorder.stopRecording();
    const base64Audio = result.value.recordDataBase64;

    if (!base64Audio) {
      console.error('No se obtuvo audio');
      return;
    }

    const blob = this.base64ToBlob(base64Audio, 'audio/aac');
    const fileName = `audio_${Date.now()}.aac`;

    const { error } = await supabase.storage.from('audios').upload(fileName, blob, {
      contentType: 'audio/aac',
      upsert: true
    });

    if (error) {
      console.error('Error al subir audio:', error);
      return;
    }

    const { data } = supabase.storage.from('audios').getPublicUrl(fileName);
    await this.sendMessage(data.publicUrl, 'audio');
  }

  async sendLocation() {
    if (!navigator.geolocation) {
      console.error('Geolocalización no soportada');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const mapUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
        await this.sendMessage(mapUrl, 'location');
      },
      (err) => {
        console.error('Error obteniendo ubicación:', err);
        alert('No se pudo obtener la ubicación.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }

  goBack() {
    this.location.back();
  }

  base64ToBlob(base64: string, mimeType: string): Blob {
    const byteCharacters = atob(base64);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);

      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      byteArrays.push(new Uint8Array(byteNumbers));
    }

    return new Blob(byteArrays, { type: mimeType });
  }
}
