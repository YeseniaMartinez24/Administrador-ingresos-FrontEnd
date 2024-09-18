import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import { ToastrService } from 'ngx-toastr';
import { Socket, io } from 'socket.io-client';
import { HomeService } from 'src/app/Servicios/home.service';
import { RegistroActividadService } from 'src/app/Servicios/registro-actividad.service';


@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.component.html',
  styleUrls: ['./inicio.component.css'],
})
export class InicioComponent implements OnInit {
  constructor(
    public auth: AuthService, 
    public homeService: HomeService,
    private logsService: RegistroActividadService,
    private router:Router,
    private fb: FormBuilder,
    private toast: ToastrService
    ) {
    this.socket = io('http://localhost:2000');
    this.miFormulario = this.fb.group({
      fechaInicio: [null, Validators.required],
      fechaFin: [null, Validators.required],
    }, { validators: this.dateRangeValidator });
  }
  isAuth :boolean = false;
  switchDiario: boolean = false;
  miFormulario: FormGroup;
  private socket: Socket;
  currentPage = 1;
  itemsPerPage = 10;
  user: any
  logs: any;
  logsDiarios: any;
  esModoOscuro:boolean = false;
  usuariosConectados: string[] = [];
  
  ngOnInit(): void {

    this.socket.on('usuarios-conectados', (usuarios: string[]) => {
      this.usuariosConectados = usuarios;
      console.log(this.usuariosConectados);
    });

    this.homeService.esModoOscuro$.subscribe((modoOscuro) => {
      this.esModoOscuro = modoOscuro;
    });

    this.auth.isAuthenticated$.subscribe(isAuthenticated =>{
      if(isAuthenticated){
        this.router.navigate(['/inicio'])
        this.isAuth = true;
      } else 
        {
          this.router.navigate(['/inicio'])
          this.isAuth = false;
        }
    })
  }

  login () {
    this.auth.loginWithRedirect();
  }

  get displayedItems(): any[] {
    const startIdx = (this.currentPage - 1) * this.itemsPerPage;
    return this.logsDiarios.slice(startIdx, startIdx + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.logsDiarios.length / this.itemsPerPage);
  }

  changePage(newPage: number): void {
    if (newPage >= 1 && newPage <= this.totalPages) {
      this.currentPage = newPage;
    }
  }

  onSwitchChange() {
    this.switchDiario = !this.switchDiario;
    this.logsDiarios = undefined;
    this.logs= undefined;
  }

  dateRangeValidator(group: FormGroup): { [key: string]: any } | null {
    const fechaInicioControl = group.get('fechaInicio');
    const fechaFinControl = group.get('fechaFin');

    if (fechaInicioControl && fechaFinControl) {
      const fechaInicio = fechaInicioControl.value;
      const fechaFin = fechaFinControl.value;

      if (fechaInicio && fechaFin && fechaInicio > fechaFin) {
        return { dateRangeInvalid: true };
      }
    }

    return null;
  }


  filtrarRegistros() {
    this.logs= undefined;
    const fechaInicio = this.miFormulario?.get('fechaInicio')?.value;
    const fechaFin = this.miFormulario.get('fechaFin')?.value;
    if (this.switchDiario == false) {
      this.logsService.obtenerLogsPorMes(fechaInicio, fechaFin).subscribe(
        data => {
          this.logs = data;
          
        },
        error => {
          console.error('Error obteniendo los reportes:', error);
          this.toast.warning('No hay datos disponibles en las fechas seleccionadas','OK',{timeOut:3000});
        }
      );
    } else {
      this.logsService.obtenerLogsPorDias(fechaInicio, fechaFin).subscribe(
        data => {
          this.logsDiarios = data;

        },
        error => {
          console.error('Error obteniendo los reportes:', error);
          this.toast.warning('No hay datos disponibles en las fechas seleccionadas','OK',{timeOut:3000});
        }
      );
    }


  }

}
