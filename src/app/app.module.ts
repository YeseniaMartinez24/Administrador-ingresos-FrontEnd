import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { IngresosComponent } from './Componentes/ingresos/ingresos.component';
import { GastosComponent } from './Componentes/gastos/gastos.component';
import { HomeComponent } from './Componentes/home/home.component';
import { HttpClientModule } from '@angular/common/http';
import { ModalModule } from 'ngx-bootstrap/modal';
import { HeaderComponent } from './Componentes/header/header.component';
import { NgxEchartsModule } from 'ngx-echarts';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ToastrModule } from 'ngx-toastr';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { DndFormatDirective } from './directives/dnd-format.directive';

// Import the module from the SDK
import { AuthModule } from '@auth0/auth0-angular';
import { InicioComponent } from './Componentes/inicio/inicio.component';

@NgModule({
  declarations: [
    AppComponent,
    IngresosComponent,
    GastosComponent,
    HomeComponent,
    HeaderComponent,
    DndFormatDirective,
    InicioComponent
  ],
  imports: [
    NgxEchartsModule.forRoot({ echarts: () => import('echarts') }),
    ModalModule.forRoot(),
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,
    BrowserAnimationsModule, // required animations module
    ToastrModule.forRoot(), // ToastrModule added, Alertas de exepciones
    SweetAlert2Module.forRoot(), //Alertas de confirmacion
    AuthModule.forRoot({
      domain: 'dev-9dwis1b5.us.auth0.com',
      clientId: 'ZPC0D1oqk4hw2tEpd6SsQzBPuIvuVf9Q',
      authorizationParams: {
        redirect_uri: window.location.origin
      }
    }),

  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
