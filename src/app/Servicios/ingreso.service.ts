import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class IngresoService {

  clienteURL='http://localhost:3000/ingresos/';

  constructor(private httpClient:HttpClient) { }

  public CargarReporteExel(reporte:FormData):Observable<any>{
    return this.httpClient.post<any>(this.clienteURL+'cargar-excel', reporte);
  }
  
  public enviarReporte(dataDiaria: any, dataMensual: any, fecha: string): Observable<any> {
    return this.httpClient.post<any>(this.clienteURL + 'cargar-registro', { 
      reporteDiario: dataDiaria,
      reporteMensual: dataMensual, 
      fechaReporte: fecha 
    });
  }

  public validarMesAño(fecha: string): Observable<any> {
    return this.httpClient.post<any>(this.clienteURL + 'validar-fecha', { 
      fecha: fecha 
    });
  }

  public obtenerReportesPorMes(fechaInicial:string, fechaFinal: string):Observable<any> {
    return this.httpClient.get<any>(this.clienteURL+ `reporte-mensual/${fechaInicial}/${fechaFinal}`)
  }

  public obtenerReportesPorDias(fechaInicial:string, fechaFinal: string):Observable<any> {
    return this.httpClient.get<any>(this.clienteURL+ `reporte-diario/${fechaInicial}/${fechaFinal}`)
  }

  public obtenerReporteMensualPorID(id:number):Observable<any> {
    return this.httpClient.get<any>(this.clienteURL+ `reporte-mensual-porId/${id}`)
  }

  public obtenerReporteDiarioPorId(id:number):Observable<any> {
    return this.httpClient.get<any>(this.clienteURL+ `reporte-diario-porId/${id}`)
  }

  public eliminarReporteDiarioPorId(id:number):Observable<any> {
    return this.httpClient.delete<any>(this.clienteURL+ `eliminar-reporte-mensual-porId/${id}`)
  }

  public obtenerIngresosTotales():Observable<any> {
    return this.httpClient.get<any>(this.clienteURL+ `suma-total-mes`)
  }

  public obtenerIngresosTotalesporFecha(fechaInicial:string, fechaFinal: string):Observable<any> {
    return this.httpClient.get<any>(this.clienteURL+ `suma-total-mes/${fechaInicial}/${fechaFinal}`)
  }
  

}

