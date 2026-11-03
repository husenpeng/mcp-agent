!include "LogicLib.nsh"

Var tomatoFinalDirectory
Var tomatoNewDirectory
Var tomatoOldDirectory
Var tomatoOldMoved
Var tomatoNewMoved
Var tomatoDirectoryError
Var tomatoDirectorySource
Var tomatoDirectoryDestination
Var tomatoRestoreError
Var tomatoDirectoryLogDirectory
Var tomatoRecoveryStopped

; MoveFileEx preserves the destination and exposes the Windows error before rollback changes it.
; Open files inside a directory can make its rename return access denied (5).
!macro tomatoDirectoryOperation SOURCE DESTINATION RESULT PHASE
  Push $0
  Push $1
  Push $2
  StrCpy $0 0
  ${Do}
    ${If} "${DESTINATION}" == ""
      System::Call 'kernel32::RemoveDirectoryW(w "${SOURCE}") i.r1 ?e'
    ${Else}
      System::Call 'kernel32::MoveFileExW(w "${SOURCE}", w "${DESTINATION}", i 0) i.r1 ?e'
    ${EndIf}
    Pop ${RESULT}
    ${If} "${DESTINATION}" == ""
      ${If} ${RESULT} == 2
      ${OrIf} ${RESULT} == 3
        StrCpy $1 1
      ${EndIf}
    ${EndIf}
    ${If} $1 != 0
      StrCpy ${RESULT} 0
      ${ExitDo}
    ${EndIf}
    ClearErrors
    FileOpen $2 "$PLUGINSDIR\directory-operations.log" a
    ${IfNot} ${Errors}
      FileSeek $2 0 END
      FileWrite $2 "${PHASE}: Windows error: ${RESULT}$\r$\n"
      FileClose $2
    ${EndIf}
    ${If} ${RESULT} != 5
    ${AndIf} ${RESULT} != 32
    ${AndIf} ${RESULT} != 33
      ${ExitDo}
    ${EndIf}
    IntOp $0 $0 + 1
    ${If} $0 >= 10
      ${ExitDo}
    ${EndIf}
    IntOp $1 $0 * 250
    Sleep $1
  ${Loop}
  Pop $2
  Pop $1
  Pop $0
!macroend

!macro tomatoReportDirectoryFailure
  ${If} $tomatoRestoreError != 0
    StrCpy $tomatoRecoveryStopped "1"
  ${EndIf}
  !ifmacrodef customInstallerDirectoryFailed
    !insertmacro customInstallerDirectoryFailed
  !else
    DetailPrint "Directory operation failed ($tomatoDirectoryError): $tomatoDirectorySource -> $tomatoDirectoryDestination; restore error: $tomatoRestoreError"
  !endif
!macroend

!macro tomatoExtractPayload FILE
  !ifmacrodef customInstallerExtract
    !insertmacro customInstallerExtract "${FILE}"
  !else
    nsExec::ExecToStack '"$PLUGINSDIR\tomato-7za.exe" x -y -bd -bb0 "-o$INSTDIR" "${FILE}"'
    Pop $R0
    Pop $R1
  !endif
  ${If} $R0 != 0
    DetailPrint $R1
    Call tomatoRollbackDirectories
    !ifmacrodef customInstallerExtractFailed
      !insertmacro customInstallerExtractFailed "${FILE}"
    !else
      MessageBox MB_OK|MB_ICONEXCLAMATION "$(decompressionFailed)" /SD IDOK
    !endif
    SetErrorLevel 2
    Quit
  ${EndIf}
!macroend

!macro tomatoStageApplication
  !ifdef TOMATO_INSTALLER_LOG_DIR
    ; electron-builder defines the cache name after including our function bodies, before this section expands.
    StrCpy $tomatoDirectoryLogDirectory "${TOMATO_INSTALLER_LOG_DIR}"
  !endif
  StrCpy $tomatoFinalDirectory $INSTDIR
  System::Call 'ole32::CoCreateGuid(g .r0) i .r1'
  ${If} $1 != 0
    SetErrorLevel 2
    Quit
  ${EndIf}
  StrCpy $tomatoNewDirectory "$INSTDIR.new-$0"
  StrCpy $tomatoOldDirectory "$INSTDIR.old-$0"
  StrCpy $tomatoOldMoved ""
  StrCpy $tomatoNewMoved ""
  StrCpy $tomatoDirectoryError 0
  StrCpy $tomatoRestoreError 0
  StrCpy $tomatoRecoveryStopped ""
  ClearErrors
  CreateDirectory $tomatoNewDirectory
  ${If} ${Errors}
    SetErrorLevel 2
    Quit
  ${EndIf}
  File /oname=$PLUGINSDIR\tomato-7za.exe "${TOMATO_SEVENZIP_PATH}"
  StrCpy $INSTDIR $tomatoNewDirectory
  SetOutPath $INSTDIR
  !insertmacro installApplicationFiles
  !ifdef TOMATO_SEVENZIP_LICENSE_DIR
    File /oname=7zip-installer-LICENSE.txt "${TOMATO_SEVENZIP_LICENSE_DIR}\LICENSE.txt"
    File /oname=7zip-installer-COPYING.txt "${TOMATO_SEVENZIP_LICENSE_DIR}\COPYING"
  !endif
  !ifdef UNINSTALLER_ICON
    File /oname=uninstallerIcon.ico "${UNINSTALLER_ICON}"
  !endif
  StrCpy $INSTDIR $tomatoFinalDirectory
  SetOutPath $PLUGINSDIR
!macroend

Function .onGUIEnd
  Call tomatoCleanupDirectories
FunctionEnd

Function tomatoCleanupDirectories
  ${If} $tomatoRecoveryStopped == "1"
    Return
  ${EndIf}
  ${If} $tomatoFinalDirectory != ""
    Call tomatoRollbackDirectories
  ${EndIf}
FunctionEnd

; Only directories created or renamed by this installer are removed during rollback.
Function tomatoRollbackDirectories
  SetOutPath $PLUGINSDIR
  ${If} $tomatoNewMoved == "1"
    RMDir /r "\\?\$tomatoFinalDirectory"
    StrCpy $tomatoNewMoved ""
  ${EndIf}
  ${If} $tomatoOldMoved == "1"
    !insertmacro tomatoDirectoryOperation "$tomatoOldDirectory" "$tomatoFinalDirectory" $tomatoRestoreError "restore"
    ${If} $tomatoRestoreError != 0
      ; Leave the complete backup in place if another process prevents restoration.
      DetailPrint $tomatoOldDirectory
      RMDir /r "\\?\$tomatoNewDirectory"
      Return
    ${EndIf}
    StrCpy $tomatoOldMoved ""
  ${EndIf}
  ${If} $tomatoNewDirectory != ""
    RMDir /r "\\?\$tomatoNewDirectory"
  ${EndIf}
  StrCpy $INSTDIR $tomatoFinalDirectory
FunctionEnd

Function tomatoPromoteDirectories
  !ifmacrodef InstallerPublishStage
    !insertmacro InstallerPublishStage 2
  !endif
  ; SetOutPath opens a directory handle; release it before either rename.
  SetOutPath $PLUGINSDIR
  ClearErrors
  ${If} ${FileExists} "$tomatoFinalDirectory\*.*"
    StrCpy $tomatoDirectorySource $tomatoFinalDirectory
    StrCpy $tomatoDirectoryDestination $tomatoOldDirectory
    !insertmacro tomatoDirectoryOperation "$tomatoDirectorySource" "$tomatoDirectoryDestination" $tomatoDirectoryError "backup"
    ${If} $tomatoDirectoryError != 0
      Call tomatoRollbackDirectories
      !insertmacro tomatoReportDirectoryFailure
      SetErrors
      Return
    ${EndIf}
    StrCpy $tomatoOldMoved "1"
  ${Else}
    ; NSIS can create the destination before the install section starts.
    StrCpy $tomatoDirectorySource $tomatoFinalDirectory
    StrCpy $tomatoDirectoryDestination ""
    !insertmacro tomatoDirectoryOperation "$tomatoDirectorySource" "" $tomatoDirectoryError "remove-empty"
    ${If} $tomatoDirectoryError != 0
      Call tomatoRollbackDirectories
      !insertmacro tomatoReportDirectoryFailure
      SetErrors
      Return
    ${EndIf}
  ${EndIf}
  ClearErrors
  StrCpy $tomatoDirectorySource $tomatoNewDirectory
  StrCpy $tomatoDirectoryDestination $tomatoFinalDirectory
  !insertmacro tomatoDirectoryOperation "$tomatoDirectorySource" "$tomatoDirectoryDestination" $tomatoDirectoryError "promote"
  ${If} $tomatoDirectoryError != 0
    Call tomatoRollbackDirectories
    !insertmacro tomatoReportDirectoryFailure
    SetErrors
    Return
  ${EndIf}
  StrCpy $tomatoNewMoved "1"
  SetOutPath $tomatoFinalDirectory
  !ifmacrodef InstallerPublishStage
    !insertmacro InstallerPublishStage 3
  !endif
  ClearErrors
FunctionEnd

!macro tomatoFinishDirectories
  StrCpy $tomatoNewMoved ""
  ${If} $tomatoOldMoved == "1"
    RMDir /r "\\?\$tomatoOldDirectory"
    StrCpy $tomatoOldMoved ""
  ${EndIf}
!macroend
