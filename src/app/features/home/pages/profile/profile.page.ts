import { Component, OnInit } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Firestore, doc, getDoc, updateDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { supabase } from '../../services/supabase';

@Component({
  standalone: false,
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit {
  user: any = {};
  userId: string = '';

  constructor(
    private firestore: Firestore,
    private auth: Auth,
    private router: Router
  ) {}

  async ngOnInit() {
    try {
      const currentUser = this.auth.currentUser;
      if (!currentUser) return;

      this.userId = currentUser.uid;
      const userRef = doc(this.firestore, 'users', this.userId);
      const snapshot = await getDoc(userRef);

      if (snapshot.exists()) {
        this.user = snapshot.data();
        this.user.email = currentUser.email;
        // Aseguramos que haya valores por defecto por si faltan campos
        this.user.firstName = this.user.firstName || '';
        this.user.surname = this.user.surname || '';
        this.user.avatar = this.user.avatar || '';
      }
    } catch (error) {
      console.error('Error cargando perfil:', error);
    }
  }

  async updateProfile() {
    try {
      const userRef = doc(this.firestore, 'users', this.userId);
      await updateDoc(userRef, {
        firstName: this.user.firstName,
        surname: this.user.surname,
      });
      alert('Cambios guardados');
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
    }
  }

  async changeProfilePhoto() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';

    fileInput.onchange = async () => {
      const file = fileInput.files?.[0];
      if (!file) return;

      const fileName = `profile_${this.userId}.jpg`;

      try {
        const { error: uploadError } = await supabase
          .storage
          .from('perfil')
          .upload(fileName, file, {
            upsert: true,
            contentType: file.type,
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase
          .storage
          .from('perfil')
          .getPublicUrl(fileName);

        const newAvatar = urlData.publicUrl;
        this.user.avatar = newAvatar;

        await updateDoc(doc(this.firestore, 'users', this.userId), {
          avatar: newAvatar,
        });

        alert('Foto actualizada');
      } catch (error) {
        console.error('Error subiendo imagen:', error);
      }
    };

    fileInput.click();
  }

  // Por si prefieres usar un botón personalizado en vez de <ion-back-button>
  goBack() {
    this.router.navigate(['/home']);
  }
}
