import { Component, ElementRef, TemplateRef, ViewChild } from '@angular/core';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { io, Socket } from 'socket.io-client';
import { HomeService } from 'src/app/Servicios/home.service';
import { GastoService } from 'src/app/Servicios/gasto.service';
import Swal from 'sweetalert2';
import { ToastrService } from 'ngx-toastr';
import { createChart, LineStyle, CrosshairMode } from 'lightweight-charts';
import { AuthService } from '@auth0/auth0-angular';
import { Router } from '@angular/router';
import { RegistroActividadService } from 'src/app/Servicios/registro-actividad.service';

@Component({
  selector: 'app-gastos',
  templateUrl: './gastos.component.html',
  styleUrls: ['./gastos.component.css']
})
export class GastosComponent {
  @ViewChild('fileInput') fileInput: ElementRef | undefined;
  selectedFile: File | undefined;
  showSpinner = false;
  bsModalRef: BsModalRef | undefined;
  selectedFileName: string | undefined;
  reporteMensual: any;
  fechaMensual: any;
  ocultarDatosMensuales: boolean = false;
  ocultarDatosDiarios: boolean = true;
  miFormulario: FormGroup;
  miFormulario2: FormGroup;
  reportes: any;
  reporte: any;
  switchDiario: boolean = false;
  GastosDiarios: any;
  reporteSeleccionado: any;
  private socket: Socket;
  currentPage = 1;
  itemsPerPage = 10;
  fechavalid: boolean = false;
  esModoOscuro: boolean = false;
  user: any;
  gmail:any;
  // Variables Grafica
  private chart: any; // Declarar la variable para el gráfico
  private lineSeries: any;
  private areaSeries: any;

  constructor(
    public auth: AuthService,
    private router: Router,
    private gatosService: GastoService,
    private homeService: HomeService,
    private logsService: RegistroActividadService,
    private modalService: BsModalService,
    private fb: FormBuilder,
    private toast: ToastrService
  ) {
    this.miFormulario = this.fb.group({
      fechaInicio: [null, Validators.required],
      fechaFin: [null, Validators.required],
    }, { validators: this.dateRangeValidator });
    this.miFormulario2 = this.fb.group({
      archivo: [null, Validators.required],
      fechaRegistro: [null, Validators.required],
    });
    this.socket = io('http://localhost:2000');
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
    // Actualizar el label del archivo seleccionado
    if (this.selectedFile) {
      this.selectedFileName = this.selectedFile.name;
    } else {
      this.selectedFileName = undefined;
    }
  }

  onFileDrop(file: File) {
    this.selectedFile = file;
    if (this.selectedFile) {
      this.selectedFileName = file.name;
    } else {
      this.selectedFileName = undefined;
    }
  }

  validarFecha(fecha: string) {
    this.gatosService.validarMesAño(fecha).subscribe(
      response => {
        if (response.disponible === true) {
          this.fechavalid = true;
        } else {
          this.fechavalid = false;
          this.toast.warning(response.message,'OK',{timeOut:3000});
        }
      },
      error => {
        console.error('Error al enviar la información', error);
      }
    )
  }

  onSubmit(event: Event, template: TemplateRef<any>) {
    event.preventDefault();
    if (this.selectedFile) {
      const formData = new FormData();
      formData.append('archivoExcel', this.selectedFile);
      setTimeout(() => {
        this.showSpinner = false;
        this.gatosService.CargarReporteExel(formData).subscribe(
          data => {
            console.log('Archivo cargado con éxito', data.data);
            this.reporteMensual = data.data
            this.fechaMensual = (document.getElementById('customDate') as HTMLInputElement).value;
            this.closeModal()
            this.miFormulario2?.get('fechaRegistro')?.reset();
            setTimeout(() => {
              this.openModal(template);
            }, 500);
          },
          err => {
            this.closeModal();
            this.toast.error('Error al cargar el archivo','FAIL',{timeOut:3000});
            this.miFormulario2?.get('fechaRegistro')?.reset();
          }
        );
      }, 2000);
    } else {
      console.error('Debes seleccionar un archivo');
    }
  }

  openModal(template: TemplateRef<any>) {
    this.bsModalRef = this.modalService.show(template, {
      backdrop: 'static',
      keyboard: false
    });
  }


  closeModal() {
    this.clearFileInput();
    this.bsModalRef?.hide();
  }


  clearFileInput() {
    this.selectedFile = undefined; // Limpia la variable selectedFile
    this.selectedFileName = undefined; // Limpia el nombre del archivo seleccionado
  }

  insertarReporteMensual() {
    const fecha = this.fechaMensual
    // Extrae la información diaria y mensual desde el objeto de reporte
    const dataDiaria = {
      fechas: this.reporteMensual.Diario.datosDelRangoDias,
      totales: this.reporteMensual.Diario.datosDelRangoTotalDia
    };
    const dataMensual = {
      salarios_total_mes: this.reporteMensual.DatosMensuales.salarios_total_mes,
      infraestructura_Mantenimiento_total_mes: this.reporteMensual.DatosMensuales.infraestructura_Mantenimiento_total_mes,
      becas_total_mes: this.reporteMensual.DatosMensuales.becas_total_mes,
      tecnologiaRecursosAprendizaje_total_mes: this.reporteMensual.DatosMensuales.tecnologiaRecursosAprendizaje_total_mes,
      serviciosEstudiantiles_total_mes: this.reporteMensual.DatosMensuales.serviciosEstudiantiles_total_mes,
      total_mes: this.reporteMensual.DatosMensuales.total_mes
    };

    console.log(dataMensual, dataDiaria, fecha)
    this.gatosService.enviarReporte(dataDiaria, dataMensual, fecha).subscribe(
      response => {
        if (this.isSocketAvailable()) {
          // El servicio Socket.io está disponible, envía el mensaje global
          this.socket.emit('reporte-cargado',this.socket.id, this.user, response.message);
        } else {
          // El servicio Socket.io no está disponible, maneja el mensaje local
          this.toast.success(response.message,'OK',{timeOut:3000});
        }
        this.logsService.guardarActividad(this.user,this.gmail,response.message).subscribe()
        this.closeModal();
        this.homeService.notifyUpdate(true);
      },
      error => {
        console.error('Error al enviar la información', error);
        this.closeModal();
      }
    );
  }

  filtrarRegistros() {
    this.reportes= undefined;
    const fechaInicio = this.miFormulario?.get('fechaInicio')?.value;
    const fechaFin = this.miFormulario.get('fechaFin')?.value;

    if (this.switchDiario == false) {
      this.gatosService.obtenerReportesPorMes(fechaInicio, fechaFin).subscribe(
        data => {
          this.reportes = data;

          this.reportes = data;
          let object = {};

          // Se genera un array para generar la grafica
          let array: object[] = [];

          // Se genera la grafica con un forEach
          this.reportes.forEach((dato: any) => {
            object = { time: this.filtrarFecha(dato.fecha), value: dato.data.total_mes }
            array.push(object);
          });

          // Se agrega la información para generar la grafica
          this.lineSeries.setData(array);
          this.areaSeries.setData(array);

        },
        error => {
          console.error('Error obteniendo los reportes:', error)
          this.toast.warning('No hay datos disponibles en las fechas seleccionadas','OK',{timeOut:3000});;
        }
      );
    } else {
      this.gatosService.obtenerReportesPorDias(fechaInicio, fechaFin).subscribe(
        data => {
          this.GastosDiarios = data;

          let object = {}

          // Se genera un array para generar la grafica
          let array: object[] = [];

          // Se genera la grafica con un forEach
          this.GastosDiarios.forEach((dato: any) => {
            object = { time: this.filtrarFecha(dato.fecha), value: parseInt(dato.total) }
            array.push(object);
          });

          console.log(array)
          // Se agrega la información para generar la grafica
          this.lineSeries.setData(array);
          this.areaSeries.setData(array);

          this.chart.timeScale().fitContent();

        },
        error => {
          console.error('Error obteniendo los reportes:', error);
          this.toast.warning('No hay datos disponibles en las fechas seleccionadas','OK',{timeOut:3000});
        }
      );
    }

  }

  get displayedItems(): any[] {
    const startIdx = (this.currentPage - 1) * this.itemsPerPage;
    return this.GastosDiarios.slice(startIdx, startIdx + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.GastosDiarios.length / this.itemsPerPage);
  }

  changePage(newPage: number): void {
    if (newPage >= 1 && newPage <= this.totalPages) {
      this.currentPage = newPage;
    }
  }

  onSwitchChange() {
    this.switchDiario = !this.switchDiario;
    this.GastosDiarios = undefined;
    this.reportes= undefined;
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

  verDetalleReporteMensual(template: TemplateRef<any>, id: number) {
    this.openModal(template);
    this.gatosService.obtenerReporteMensualPorID(id).subscribe(
      data => {
        this.reporte = data;
        console.log(this.reporte);
      },
      error => {
        console.error('Error obteniendo los reportes:', error);
      }
    )
  }

  eliminarReporteMensual(id: number){ 
    Swal.fire({
      title: '¿Estas Seguro?',
      text: 'No podras desaser la acción',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'OK',
      cancelButtonText: 'Cancelar'
    }).then((result)=>{
        if(result.value){
          this.gatosService.eliminarReporteDiarioPorId(id).subscribe(
            data => {
              const fecha = new Date(data.data.fecha);
              const formattedDate = `${fecha.getMonth() + 1}/${fecha.getFullYear()}`; // Los meses van de 0 a 11, así que añadimos +1

              if (this.isSocketAvailable()) {
                // El servicio Socket.io está disponible, envía el mensaje global
                this.socket.emit('reporte-eliminado',this.socket.id, this.user, data);
                this.homeService.notifyUpdate(true); 
              } else {
                // Formatear la fecha a MM/yyyy
                this.toast.success(data.message+' '+formattedDate,'OK',{timeOut:3000});
              }
              this.logsService.guardarActividad(this.user,this.gmail,data.message+' '+formattedDate).subscribe()
              this.filtrarRegistros()
            },
            error => {
              console.error('Error obteniendo los reportes:', error);
            }
          )
        }else if(result.dismiss===Swal.DismissReason.cancel){
          Swal.fire(
            'Cancelado',
            'Ingreso no eliminado',
            'error'
          )
        }
      })
  }

  private isSocketAvailable(): boolean {
    return this.socket.connected;
  }

  modoOscuro() {
    this.homeService.modoOscuro.subscribe((value: boolean) => {
      if (value == false) {
        this.chart.applyOptions({
          layout: {
            background: {
              color: '#000000',
            },
            textColor: '#fff',
          },
        })
      }

      if (value == true) {
        this.chart.applyOptions({
          layout: {
            background: {
              color: '#000000',
            },
            textColor: '#fff',
          },
        })
      }

    })
  }


  ngOnInit() {

    
    this.auth.isAuthenticated$.subscribe(isAuthenticated =>{
      if(!isAuthenticated){
        this.router.navigate(['/inicio'])
      } else {
        this.auth.user$.subscribe(user => {
          if (user) {
            this.user = user.given_name;
            this.gmail = user.email
          }
        });
      } 
      
    })
    
    this.homeService.esModoOscuro$.subscribe((modoOscuro) => {
      this.esModoOscuro = modoOscuro;
    });

    // Get the current users primary locale
    const currentLocale = window.navigator.languages[0];

    // Create a number format using Intl.NumberFormat
    const myPriceFormatter = Intl.NumberFormat(currentLocale, {
      style: 'currency',
      currency: 'MXN', // Currency for data points
    }).format;

    this.chart = createChart('chart-container-gastos', {
      localization: {
        priceFormatter: myPriceFormatter,
      },
      layout: {
        background: {
          color: '#000000',
        },
        textColor: '#d1d4dc',
        fontFamily: "'Roboto', sans-serif"
      },
      grid: {
        vertLines: {
          visible: false,
        },
        horzLines: {
          color: 'rgba(42, 46, 57, 0.5)',
        },
      },
      rightPriceScale: {
        borderVisible: false,
      },
      timeScale: {
        borderVisible: false,
      },
    });

    this.chart.applyOptions({
      crosshair: {
        style: LineStyle.Solid,
        // Change mode from default 'magnet' to 'normal'.
        // Allows the crosshair to move freely without snapping to datapoints
        mode: CrosshairMode.Normal,

        // Vertical crosshair line (showing Date in Label)
        vertLine: {
          width: 8,
          color: "#000000",

          labelBackgroundColor: "#9B7DFF",
        },

        // Horizontal crosshair line (showing Price in Label)
        horzLine: {
          color: "#9B7DFF",
          labelBackgroundColor: "#9B7DFF",
        },
      },
    });

    this.areaSeries = this.chart.addAreaSeries({
      topColor: 'rgba(76, 175, 80, 0.56)',
      bottomColor: 'rgba(76, 175, 80, 0.04)',
      lineColor: 'transparent', // hide the line
      lineWidth: 2,
      lastValueVisible: false, // hide the last value marker for this series
      crosshairMarkerVisible: false, // hide the crosshair marker for this series

    });
    // Set the data for the Area Series


    this.lineSeries = this.chart.addLineSeries({ color: '#47CA47' });

    const datos = [
      { time: '2023-01-01', value: 0 },

    ];

    datos.forEach((dato: any) => {
      this.lineSeries.update(
        dato
      );
      this.areaSeries.update(dato);
    });



    this.modoOscuro();
  }

  filtrarFecha(fechaOriginal: any): String {
    const fecha = new Date(fechaOriginal); // Convierte la fecha original en un objeto Date
    const year = fecha.getFullYear(); // Obtiene el año
    const month = (fecha.getMonth() + 1).toString().padStart(2, '0'); // Obtiene el mes y lo formatea
    const day = fecha.getDate().toString().padStart(2, '0'); // Obtiene el día y lo formatea

    const fechaFormateada = `${year}-${month}-${day}`; // Crea la fecha formateada

    return fechaFormateada;
  }

}
