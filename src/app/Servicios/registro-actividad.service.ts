import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RegistroActividadService {

  
  clienteURL='http://localhost:3000/activityLog/';

  constructor(private httpClient:HttpClient) { }

  public guardarActividad(responsable: string, gmail: string, actividad: string): Observable<any> {
    return this.httpClient.post<any>(this.clienteURL + 'log', { 
      responsable: responsable,
      gmail: gmail, 
      actividad: actividad 
    });
  }

  public obtenerLogsPorMes(fechaInicial:string, fechaFinal: string):Observable<any> {
    return this.httpClient.get<any>(this.clienteURL+ `logs-mensual/${fechaInicial}/${fechaFinal}`)
  }

  public obtenerLogsPorDias(fechaInicial:string, fechaFinal: string):Observable<any> {
    return this.httpClient.get<any>(this.clienteURL+ `logs-diarios/${fechaInicial}/${fechaFinal}`)
  }

  public obtenerLogPorID(id:number):Observable<any> {
    return this.httpClient.get<any>(this.clienteURL+ `log/${id}`)
  }

  

}
