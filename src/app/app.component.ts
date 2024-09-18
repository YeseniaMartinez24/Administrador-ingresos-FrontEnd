import { Component, OnInit } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { HomeService } from './Servicios/home.service';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '@auth0/auth0-angular';
import { Router } from '@angular/router';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  title = 'FrontEnd';
  private socket!: Socket;
  public theme: 'light' | 'dark' = 'light';
  user: any

  constructor(
    private homeServices: HomeService,
    private toast: ToastrService,
    public auth: AuthService,
    private router: Router
  ) {
    
  }

  ngOnInit() {

    this.auth.isAuthenticated$.subscribe(isAuthenticated => {
      if (isAuthenticated) {
        this.socket = io('http://localhost:2000');
        
        // Escucha el evento 'excel-procesado' para recibir mensajes globales
        this.socket.on('reporte-cargado', (mensagge: any) => {
          this.toast.success(mensagge, 'OK', { timeOut: 3000 });
        });

        this.socket.on('reporte-eliminado', (mensagge: any) => {
          this.toast.success(mensagge, 'OK', { timeOut: 3000 });
        });

      }
    })

  }

  TemaOscuro() {
    document.querySelector('body')?.setAttribute('data-bs-theme', 'dark');
    document.body.classList.add('dark-mode');
    document.querySelector('#icon')?.setAttribute('class', 'fa-solid fa-sun');
    this.theme = 'dark';
    this.homeServices.setModoOscuro(true);
  }

  TemaClaro() {
    document.querySelector('body')?.setAttribute('data-bs-theme', 'light');
    document.body.classList.remove('dark-mode');
    document.querySelector('#icon')?.setAttribute('class', 'fa-solid fa-moon');
    this.theme = 'light';
    this.homeServices.setModoOscuro(false);
  }

  CambiarTema() {
    document.querySelector('body')?.getAttribute('data-bs-theme') === 'light'
      ? this.TemaOscuro()
      : this.TemaClaro();
  }
}
