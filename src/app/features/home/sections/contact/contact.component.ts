import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Github, Linkedin, LucideAngularModule, Mail, MessageSquare, Send } from 'lucide-angular';
import { CONTACT_FORM_ENDPOINT, PROFILE } from '../../../../data/site.data';

type Status = 'idle' | 'sending' | 'sent' | 'error';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [ReactiveFormsModule, LucideAngularModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss'
})
export class ContactComponent {
  readonly profile = PROFILE;
  readonly icons: Record<string, typeof Github> = { github: Github, linkedin: Linkedin, mail: Mail, chat: MessageSquare, send: Send };

  private fb = inject(FormBuilder);
  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(80)]],
    email: ['', [Validators.required, Validators.email]],
    message: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(2000)]],
  });
  status = signal<Status>('idle');

  invalid(field: 'name' | 'email' | 'message'): boolean {
    const c = this.form.controls[field];
    return c.invalid && (c.touched || c.dirty);
  }

  async submit(): Promise<void> {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const { name, email, message } = this.form.getRawValue();

    // No backend configured: hand the message to the visitor's mail client
    if (!CONTACT_FORM_ENDPOINT) {
      const subject = encodeURIComponent(`Portfolio contact – ${name}`);
      const body = encodeURIComponent(`${message}\n\n— ${name} (${email})`);
      window.location.href = `mailto:${this.profile.email}?subject=${subject}&body=${body}`;
      this.status.set('sent');
      return;
    }

    this.status.set('sending');
    try {
      const res = await fetch(CONTACT_FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ name, email, message }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      this.form.reset();
      this.status.set('sent');
    } catch {
      this.status.set('error');
    }
  }
}
