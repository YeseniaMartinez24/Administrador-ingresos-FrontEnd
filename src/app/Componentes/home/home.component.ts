import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { GastoService } from 'src/app/Servicios/gasto.service';
import { HomeService } from 'src/app/Servicios/home.service';
import { IngresoService } from 'src/app/Servicios/ingreso.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import * as echarts from 'echarts';
import { AuthService } from '@auth0/auth0-angular';
import { Router } from '@angular/router';
import { Socket, io } from 'socket.io-client';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  private socket: Socket;
  esModoOscuro: boolean = false;
  hayDatos: boolean = true;
  totalIngreso: number = 0;
  total: number = 0;
  totalGastos: number = 0;

  totalFormato: String = "";
  ingresoFormato: String = "";
  gastoFormato: String = "";

  // Variables formulario
  switchDiario: boolean = false;
  miFormulario: FormGroup;
  reportes: any;

  // Variable graficas
  chartDom: any
  myChart: any
  user:any

  constructor
    (
      public auth: AuthService,
      private router:Router,
      private ingresoService: IngresoService,
      private gastosService: GastoService,
      private homeService: HomeService,
      private fb: FormBuilder,
    ) {
    this.miFormulario = this.fb.group({
      fechaInicio: [null, Validators.required],
      fechaFin: [null, Validators.required],
    }, { validators: this.dateRangeValidator });
    this.socket = io('http://localhost:2000');
  }

  ngOnInit() {

    this.auth.isAuthenticated$.subscribe(isAuthenticated =>{
      if(!isAuthenticated){
        this.router.navigate(['/inicio'])
      }
    })


    this.homeService.esModoOscuro$.subscribe((modoOscuro) => {
      this.esModoOscuro = modoOscuro;
    });

    this.getTotales();


    this.homeService.currentUpdate.subscribe(updated => {
      if (updated) {
        this.getTotales();
        this.modoOscuro();
        this.homeService.notifyUpdate(false); // resetear el estado de actualización
      }
    });
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


  getTotales() {
    forkJoin({
      ingreso: this.ingresoService.obtenerIngresosTotales(),
      gasto: this.gastosService.obtenerGastosTotales()
    }).subscribe(result => {
      this.totalIngreso = result.ingreso.suma_total_mes;
      this.totalGastos = result.gasto.suma_total_mes;
      if (this.totalIngreso === null && this.totalGastos === null) {
        this.hayDatos = false;
      } else {
        this.hayDatos = true;
     }

      // Aquí es donde debes realizar el cálculo
      this.total = this.totalIngreso - this.totalGastos;
      this.actualizarGrafica();
      this.ingresoFormato = this.formatoDinero(this.totalIngreso);
      this.gastoFormato = this.formatoDinero(this.totalGastos);
      this.totalFormato = this.formatoDinero(this.total);
    },
      error => {
        console.error('Error obteniendo los reportes:', error);
      });
  }

  formatoDinero(value: any) {
    value = parseInt(value);
    return '$ ' + value.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
  }

  modoOscuro() {
    this.homeService.modoOscuro.subscribe((value: boolean) => {

      if (value == false) {
        this.myChart.setOption({
          theme: 'light', // Aplica el tema oscuro
          backgroundColor: '#ffffff', // Cambia el color de fondo a blanco
          textStyle: {
            color: '#000000' // Cambia el color del texto a negro
          },
          legend: {
            textStyle: {
              color: 'black' // Cambia el color del texto de la leyenda a blanco
            }
          },
        })
        console.log(value)
      }


      if (value == true) {
        this.myChart.setOption({
          theme: 'dark', // Aplica el tema oscuro
          backgroundColor: '#212529', // Cambia el color de fondo a negro
          textStyle: {
            color: '#ffffff' // Cambia el color del texto a blanco
          },
          legend: {
            textStyle: {
              color: 'white' // Cambia el color del texto de la leyenda a blanco
            }
          },
        })
        console.log(value)
      }


    })
  }

  actualizarGrafica() {
    this.chartDom = document.getElementById('Grafica-Principal');
    this.myChart = echarts.init(this.chartDom);
    var option;

    option = {
      tooltip: {
        trigger: 'item'
      },
      legend: {
        orient: 'vertical',
        left: 'left'
      },
      color: ['#1781E8', '#FF0DC0'],
      series: [
        {
          name: 'Access From',
          type: 'pie',
          radius: '92%',
          data: [
            { value: this.totalIngreso, name: 'Ingresos' },
            { value: this.totalGastos, name: 'Gastos' }
          ],
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }
      ]
    };


    option && this.myChart.setOption(option);
  }

  filtrarRegistros(){
   this.ngOnInit()
    const fechaInicio = this.miFormulario?.get('fechaInicio')?.value;
    const fechaFin = this.miFormulario.get('fechaFin')?.value;

      forkJoin({
        ingreso: this.ingresoService.obtenerIngresosTotalesporFecha(fechaInicio,fechaFin),
        gasto: this.gastosService.obtenerGastosTotalesporFecha(fechaInicio,fechaFin)
      }).subscribe(result => {
        this.totalIngreso = result.ingreso.suma_total_mes;
        this.totalGastos = result.gasto.suma_total_mes;
        if (this.totalIngreso === null && this.totalGastos === null) {
          this.hayDatos = false;
        } else {
          this.hayDatos = true;
        }
  
        // Aquí es donde debes realizar el cálculo
        this.total = this.totalIngreso - this.totalGastos;
        this.actualizarGrafica();
        this.ingresoFormato = this.formatoDinero(this.totalIngreso);
        this.gastoFormato = this.formatoDinero(this.totalGastos);
        this.totalFormato = this.formatoDinero(this.total);
      },
        error => {
          console.error('Error obteniendo los reportes:', error);
        });
  } 

reset() {
  this.totalIngreso = 0;
  this.totalGastos = 15600;
  this.total = this.totalIngreso - this.totalGastos;
  this.hayDatos = true;
  this.ingresoFormato = this.formatoDinero(this.totalIngreso);
  this.gastoFormato = this.formatoDinero(this.totalGastos);
  this.totalFormato = this.formatoDinero(this.total);
  this.getTotales(); // Llama a la función para obtener los totales
}

}
