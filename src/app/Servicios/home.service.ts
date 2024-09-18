import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HomeService {
  esModoOscuro:boolean=false;
  private updateSource = new BehaviorSubject<boolean>(false); // inicialmente falso
  currentUpdate = this.updateSource.asObservable();
  modoOscuro = new BehaviorSubject<boolean>(false);

  private esModoOscuroSource = new BehaviorSubject<boolean>(false); // inicialmente falso
  esModoOscuro$ = this.esModoOscuroSource.asObservable();

  notifyUpdate(status: boolean) {
    this.updateSource.next(status);
  }

  setModoOscuro(status: boolean) {
    this.esModoOscuroSource.next(status);
  }

  constructor() { }
}
